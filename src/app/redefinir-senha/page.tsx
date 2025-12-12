'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ForgotPasswordLayout } from '@/components/auth/ForgotPasswordLayout';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
    return (
        <ErrorBoundary>
            <ForgotPasswordLayout>
                <ResetPasswordForm />
            </ForgotPasswordLayout>
        </ErrorBoundary>
    );
}
