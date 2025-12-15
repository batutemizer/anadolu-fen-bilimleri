import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alf Kurs Merkezi",
  description: "TYT – AYT hazırlık programları ve veli takip sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          {children}
        </div>
      </body>
    </html>
  );
}

