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
    default: "Avenlyo",
    template: "%s · Avenlyo",
  },
  description:
    "Manage customer conversations, business knowledge and human handoffs.",
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body>{children}</body>
    </html>
  );
}
