import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Avenlyo · Your AI front office",
    template: "%s · Avenlyo",
  },
  description:
    "Turn your business knowledge into helpful answers and useful inquiries.",
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
