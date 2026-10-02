import React from 'react';
import { LoginPageLayout } from '@/components/login/LoginPageLayout';

interface RegistroPageLayoutProps {
  children: React.ReactNode;
}

export const RegistroPageLayout = React.memo(function RegistroPageLayout({
  children,
}: RegistroPageLayoutProps) {
  return <LoginPageLayout>{children}</LoginPageLayout>;
});

RegistroPageLayout.displayName = 'RegistroPageLayout';
