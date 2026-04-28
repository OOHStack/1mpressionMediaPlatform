import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "1mpression Media — Operations Platform",
  description: "Internal operations platform for 1mpression Media",
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
