import type { Metadata } from "next";
import "./globals.css";
import "@/styles/print.css";

export const metadata: Metadata = {
  title: "Avenir Souriant — Management",
  description: "Internal management application — Avenir Souriant Centre",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
