import Fastify, { type FastifyRequest } from "fastify";
import { createHash, randomUUID } from "node:crypto";
import { gunzipSync } from "node:zlib";
import type { Database } from "../../packages/core/db";
import { authenticate, type Principal } from "../../packages/core/auth";
import { decodeOtlp, type Signal } from "../../packages/core/otlp";
import { IdempotencyConflict, storeBatch } from "./store";
import type { RateLimiter } from "./rate-limit";
export function createIngestServer(
  db: Database,
  limiter: RateLimiter,
  maxConcurrent = 16,
) {
  if (!Number.isInteger(maxConcurrent) || maxConcurrent < 1)
    throw new Error("Invalid capacity");
  const app = Fastify({
    bodyLimit: 1024 * 1024,
    requestTimeout: 15000,
    connectionTimeout: 10000,
    logger: { redact: ["req.headers.authorization"] },
    disableRequestLogging: true,
  });
  let active = 0;
  const admitted = new WeakSet<FastifyRequest>();
  const principals = new WeakMap<FastifyRequest, Principal>();
  app.removeContentTypeParser("application/json");
  app.addContentTypeParser(
    "application/json",
    { parseAs: "buffer" },
    (request, body, done) => {
      try {
        let buffer = body as Buffer;
        const encoding = request.headers["content-encoding"];
        if (encoding && encoding !== "identity" && encoding !== "gzip")
          throw new Error("Unsupported content encoding");
        if (encoding === "gzip")
          buffer = gunzipSync(buffer, { maxOutputLength: 1024 * 1024 });
        done(null, JSON.parse(buffer.toString("utf8")) as unknown);
      } catch {
        done(
          Object.assign(new Error("Invalid or oversized JSON/gzip body"), {
            statusCode: 400,
          }),
        );
      }
    },
  );
  app.setErrorHandler((error, _request, reply) => {
    const status = (error as { statusCode?: number }).statusCode;
    void reply
      .code(status && status < 500 ? status : 503)
      .send({
        message:
          status && status < 500
            ? "Invalid request"
            : "Temporarily unavailable; retry",
      });
  });
  app.addHook("onRequest", async (request, reply) => {
    if (request.url === "/health") return;
    if (active >= maxConcurrent)
      return reply
        .code(429)
        .header("Retry-After", "1")
        .send({ message: "Ingest capacity exhausted" });
    active++;
    admitted.add(request);
    const principal = await authenticate(db, request.headers.authorization, [
      "ingest",
    ]);
    if (!principal)
      return reply.code(401).send({ message: "Valid ingest key required" });
    principals.set(request, principal);
    try {
      if (!(await limiter.allow(principal.keyId)))
        return reply
          .code(429)
          .header("Retry-After", "60")
          .send({ message: "Ingest key rate limit exceeded" });
    } catch {
      return reply
        .code(503)
        .header("Retry-After", "2")
        .send({ message: "Rate limiter unavailable" });
    }
  });
  app.addHook("onResponse", async (request) => {
    if (admitted.delete(request)) active--;
  });
  app.get("/health", async () => ({
    status: "ok",
    active,
    capacity: maxConcurrent,
  }));
  for (const signal of ["logs", "metrics", "traces"] satisfies Signal[])
    app.post(`/v1/${signal}`, async (request, reply) => {
      const principal = principals.get(request);
      if (!principal)
        return reply.code(401).send({ message: "Valid ingest key required" });
      let records;
      try {
        records = decodeOtlp(signal, request.body);
      } catch (error) {
        return reply
          .code(400)
          .send({
            message:
              error instanceof Error ? error.message : "Invalid OTLP request",
          });
      }
      const supplied = request.headers["idempotency-key"];
      if (
        supplied !== undefined &&
        (typeof supplied !== "string" ||
          !/^[A-Za-z0-9._:-]{1,128}$/.test(supplied))
      )
        return reply.code(400).send({ message: "Invalid idempotency key" });
      const requestId = supplied ?? randomUUID();
      const hash = createHash("sha256")
        .update(signal)
        .update(JSON.stringify(request.body))
        .digest("hex");
      try {
        await storeBatch(
          db,
          principal,
          signal,
          records,
          requestId,
          hash,
          request.body,
        );
      } catch (error) {
        if (error instanceof IdempotencyConflict)
          return reply.code(409).send({ message: error.message });
        request.log.error(
          { err: error },
          "Durable write failed or commit outcome uncertain",
        );
        return reply
          .code(503)
          .header("Retry-After", "2")
          .send({
            message:
              "Write unavailable or outcome uncertain; retry with same idempotency key",
          });
      }
      return reply
        .header("x-signalpost-request-id", requestId)
        .code(200)
        .send({});
    });
  return app;
}
