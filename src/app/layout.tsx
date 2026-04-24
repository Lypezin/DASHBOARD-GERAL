import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AppLayoutShell } from "@/components/AppLayoutShell";
import { ThemeProviderWrapper } from "@/components/ThemeProviderWrapper";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

const outfit = Outfit({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: "Dashboard Geral | Analise de Entregas",
  description: "Dashboard profissional para visualizacao e analise de dados de entregas em tempo real.",
  keywords: ["dashboard", "entregas", "analise", "metricas", "aderencia"],
  authors: [{ name: "Dashboard Team" }],
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" }
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${outfit.variable} ${inter.variable} antialiased`}>
        <ThemeProviderWrapper>
          <Toaster richColors position="top-right" />
          <TooltipProvider delayDuration={0}>
            <AppLayoutShell>{children}</AppLayoutShell>
          </TooltipProvider>
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
