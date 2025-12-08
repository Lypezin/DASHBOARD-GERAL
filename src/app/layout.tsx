import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { ThemeProviderWrapper } from "@/components/ThemeProviderWrapper";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { ChunkReloadListener } from "@/components/ChunkReloadListener";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Dashboard Geral | Análise de Entregas",
  description: "Dashboard profissional para visualização e análise de dados de entregas em tempo real.",
  keywords: ["dashboard", "entregas", "análise", "métricas", "aderência"],
  authors: [{ name: "Dashboard Team" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" }
  ],
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProviderWrapper>
          <OrganizationProvider>
            <ChunkReloadListener />
            <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
              <Header />
              <main className="flex-1 transition-all duration-300">{children}</main>
            </div>
          </OrganizationProvider>
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
