import React from 'react';
import Image from 'next/image';

interface LoginPageLayoutProps {
  children: React.ReactNode;
}

export const LoginPageLayout = React.memo(function LoginPageLayout({
  children,
}: LoginPageLayoutProps) {
  return (
    <div className="folhas-world flex min-h-screen w-full items-center justify-center bg-background px-4 py-6 sm:px-6 lg:px-10">
      <div className="grid min-h-[min(760px,calc(100vh-3rem))] w-full max-w-6xl overflow-hidden rounded-xl border border-border bg-card shadow-sm md:grid-cols-[minmax(250px,0.78fr)_minmax(0,1.22fr)]">
        <aside className="flex min-h-36 flex-col items-center justify-center bg-[#0754d8] px-6 py-6 text-center text-white md:min-h-full md:px-8">
          <Image
            src="/logo.png"
            alt="GO Itaim"
            width={176}
            height={176}
            priority
            className="h-28 w-28 object-contain sm:h-36 sm:w-36"
          />
          <div className="mt-3 hidden w-full max-w-[190px] border-t border-white/50 pt-4 md:block">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/95">
              Dashboard Geral
            </p>
          </div>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/90 md:hidden">
            Dashboard Geral
          </p>
        </aside>

        <section className="flex min-w-0 items-center justify-center px-5 py-8 sm:px-10 md:px-12 lg:px-16">
          <div className="w-full max-w-[470px]">{children}</div>
        </section>
      </div>
    </div>
  );
});

LoginPageLayout.displayName = 'LoginPageLayout';
