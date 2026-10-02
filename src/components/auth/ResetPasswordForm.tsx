import React, { useCallback, useState } from 'react';
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
            <div className="mb-8 text-center">
                <h2 className="mb-2 text-2xl font-bold text-slate-800">Nova Senha</h2>
                <p className="text-sm font-medium text-slate-500">
                    {checkingRecovery ? 'Validando seu link de redefinicao...' : 'Crie uma senha forte para sua conta'}
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
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white h-11 px-8 shadow-lg shadow-blue-500/25 border-0 transition-all active:scale-[0.98]"
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
        </>
    );
});

ResetPasswordForm.displayName = 'ResetPasswordForm';
