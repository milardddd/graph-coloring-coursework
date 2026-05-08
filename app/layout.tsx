import type { Metadata } from "next";
import { Montserrat, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  variable: "--font-montserrat",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Розфарбовування графів | Рибалко Т.С.",
  description: "Курсова робота: програмне забезпечення для розфарбовування графів.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${jetbrainsMono.variable} font-sans bg-[var(--background)] text-[var(--foreground)]`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}