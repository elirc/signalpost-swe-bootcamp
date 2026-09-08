import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Signalpost · Engineering fieldwork",
  description:
    "A self-paced engineering bootcamp built around an observability platform. Evidence before confidence.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
