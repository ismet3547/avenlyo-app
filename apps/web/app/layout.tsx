import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";
const geist = localFont({
  src: "./fonts/geist.ttf",
  variable: "--font-geist",
  display: "swap",
  weight: "100 900",
});
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
      <body className={geist.variable}>{children}</body>
    </html>
  );
}
