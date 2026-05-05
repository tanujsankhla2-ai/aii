import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sales Avatar",
  description: "Real-Time 3D AI Sales Avatar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
