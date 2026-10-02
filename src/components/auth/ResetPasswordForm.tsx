import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useResetPassword } from '@/hooks/auth/useResetPassword';
import { usePasswordStrength } from '@/hooks/registro/useRegistroValidation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { ResetPasswordSuccess } from './components/ResetPasswordSuccess';
import { ResetPasswordInputs } from './components/ResetPasswordInputs';

export const ResetPasswordForm = React.memo(function ResetPasswordForm() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { loading, checkingRecovery, error, success, canReset, resetPassword } = useResetPassword();
    const passwordStrength = usePasswordStrength(password);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return; // Validation handled by UI state
        }

        resetPassword(password);
    }, [password, confirmPassword, resetPassword]);

    if (success) {
        return <ResetPasswordSuccess />;
    }

    return (
        <>
            <div className="mb-8 text-left">
                <h1 className="mb-1 text-3xl font-bold tracking-tight text-foreground">Nova Senha</h1>
                <p className="text-sm text-muted-foreground">
                    {checkingRecovery ? 'Validando seu link de redefinição...' : 'Crie uma senha forte para sua conta'}
                </p>
            </div>

            {checkingRecovery && (
                <Alert className="mb-6 border-blue-200 bg-blue-50 text-blue-700">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <AlertDescription>Estamos validando o link enviado por email. Aguarde alguns segundos.</AlertDescription>
                </Alert>
            )}

            {error && (
                <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-700">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <ResetPasswordInputs
                    password={password}
                    setPassword={setPassword}
                    confirmPassword={confirmPassword}
                    setConfirmPassword={setConfirmPassword}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    showConfirmPassword={showConfirmPassword}
                    setShowConfirmPassword={setShowConfirmPassword}
                    loading={loading || checkingRecovery || !canReset}
                    passwordStrength={passwordStrength}
                />

                <Button
                    type="submit"
                    disabled={loading || checkingRecovery || !canReset || password !== confirmPassword || password.length < 6}
                    className="h-11 w-full border-0 bg-[#0754d8] px-8 text-white shadow-sm transition-colors hover:bg-[#0647b7] active:scale-[0.98]"
                >
                    {loading || checkingRecovery ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {checkingRecovery ? 'Validando link...' : 'Redefinindo...'}
                        </>
                    ) : (
                        'Redefinir Senha'
                    )}
                </Button>
            </form>
            {!checkingRecovery && !canReset && (
                <div className="mt-6 border-t border-border pt-5 text-center">
                    <Link href="/esqueci-senha" className="text-sm font-semibold text-primary hover:underline">
                        Solicitar novo link de redefinição
                    </Link>
                </div>
            )}
        </>
    );
});

ResetPasswordForm.displayName = 'ResetPasswordForm';
