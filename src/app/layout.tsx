import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bingo Online",
  description: "Online Bingo Spiel für Gruppen – erstelle und teile dein eigenes Bingo!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
