'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ForgotPasswordLayout } from '@/components/auth/ForgotPasswordLayout';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
    return (
        <ErrorBoundary>
            <ForgotPasswordLayout>
                <ForgotPasswordForm />
            </ForgotPasswordLayout>
        </ErrorBoundary>
    );
}
