import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HerHeart · Women's heart health, finally understood",
  description: "A proactive, female-specific cardiovascular AI companion.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
