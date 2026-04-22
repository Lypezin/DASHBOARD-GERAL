import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppLayoutShell } from "@/components/AppLayoutShell";
import { ThemeProviderWrapper } from "@/components/ThemeProviderWrapper";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { GamificationProvider } from "@/contexts/GamificationContext";
import { UserActivityTracker } from "@/components/UserActivityTracker";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

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
            <GamificationProvider>
              <UserActivityTracker />
              <Toaster richColors position="top-right" />
              <TooltipProvider delayDuration={0}>
                <AppLayoutShell>{children}</AppLayoutShell>
              </TooltipProvider>
            </GamificationProvider>
          </OrganizationProvider>
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
