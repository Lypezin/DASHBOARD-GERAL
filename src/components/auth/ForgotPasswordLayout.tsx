import React from 'react';
import { LoginPageLayout } from '@/components/login/LoginPageLayout';

interface ForgotPasswordLayoutProps {
    children: React.ReactNode;
}

export const ForgotPasswordLayout = React.memo(function ForgotPasswordLayout({
    children,
}: ForgotPasswordLayoutProps) {
    // Reuse the Login layout for consistency
    return (
        <LoginPageLayout>
            {children}
        </LoginPageLayout>
    );
});

ForgotPasswordLayout.displayName = 'ForgotPasswordLayout';
