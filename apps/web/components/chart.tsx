"use client";
import { useEffect, useRef } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
export function TelemetryChart() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const times = Array.from({ length: 180 }, (_, i) => 1735689600 + i * 30);
    const values = times.map((_, i) =>
      Math.round(
        120 +
          Math.sin(i / 9) * 24 +
          Math.cos(i / 3) * 7 +
          (i > 95 && i < 115 ? 60 : 0),
      ),
    );
    const chart = new uPlot(
      {
        width: ref.current.clientWidth,
        height: 220,
        legend: { show: false },
        cursor: { show: false },
        select: { show: false, left: 0, top: 0, width: 0, height: 0 },
        axes: [
          { stroke: "#697475", grid: { show: false }, font: "11px monospace" },
          {
            stroke: "#697475",
            grid: { stroke: "#e7e8e3" },
            font: "11px monospace",
            size: 44,
          },
        ],
        series: [
          {},
          {
            label: "Synthetic ingest rate",
            stroke: "#287d69",
            width: 2,
            fill: "#287d6910",
          },
        ],
      },
      [times, values],
      ref.current,
    );
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) chart.setSize({ width, height: 220 });
    });
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      chart.destroy();
    };
  }, []);
  return (
    <figure>
      <div ref={ref} aria-hidden="true" />
      <figcaption>
        Synthetic example: ingest varies around 120 records/second, with a brief
        rise near 180. This is not a measured benchmark.
      </figcaption>
    </figure>
  );
}
