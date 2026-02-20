import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Career Sniper - AI Job Agent",
  description: "Your personal Job Hunting OS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
