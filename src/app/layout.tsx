import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bingo Online",
  description: "Online Bingo für Gruppen – erstelle und teile dein eigenes Bingo!",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
