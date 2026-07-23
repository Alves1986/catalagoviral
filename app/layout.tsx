import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Catálogo Viral — Afiliados que convertem",
  description:
    "Centralize produtos de alta comissão, gere links rastreáveis, crie copy com IA e divulgue em grupos de WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${jakarta.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
