
import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useResetPassword } from '@/hooks/auth/useResetPassword';
import { usePasswordStrength } from '@/hooks/registro/useRegistroValidation';
import { PasswordStrengthIndicator } from '@/components/registro/PasswordStrengthIndicator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export const ResetPasswordForm = React.memo(function ResetPasswordForm() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { loading, error, success, resetPassword } = useResetPassword();
    const passwordStrength = usePasswordStrength(password);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return; // Validation handled by UI state
        }

        resetPassword(password);
    }, [password, confirmPassword, resetPassword]);

    if (success) {
        return (
            <div className="text-center space-y-6">
                <div className="flex justify-center">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Senha Atualizada!</h2>
                    <p className="text-slate-500">
                        Sua senha foi redefinida com sucesso.
                        Você já pode fazer login com a nova senha.
                    </p>
                </div>
                <Link
                    href="/login"
                    className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg shadow-lg transition-all"
                >
                    Ir para o Login
                </Link>
            </div>
        );
    }

    return (
        <>
            <div className="mb-8 text-center">
                <h2 className="mb-2 text-2xl font-bold text-slate-800">Nova Senha</h2>
                <p className="text-sm font-medium text-slate-500">
                    Crie uma senha forte para sua conta
                </p>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-700">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    {/* Password */}
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-slate-600 font-medium">Nova Senha</Label>
                        <div className="relative group">
                            <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 transition duration-300 group-hover:opacity-20 blur"></div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="pl-9 pr-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm"
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="pt-1">
                            <PasswordStrengthIndicator
                                password={password}
                                strength={passwordStrength.strength}
                                label={passwordStrength.label}
                                color={passwordStrength.color}
                            />
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-slate-600 font-medium">Confirmar Nova Senha</Label>
                        <div className="relative group">
                            <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 transition duration-300 group-hover:opacity-20 blur"></div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="pl-9 pr-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm"
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        {confirmPassword.length > 0 && (
                            <div className={`text-xs font-medium mt-1 ${password === confirmPassword ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {password === confirmPassword ? '✓ Senhas coincidem' : 'As senhas não coincidem'}
                            </div>
                        )}
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={loading || password !== confirmPassword || password.length < 6}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white h-11 px-8 shadow-lg shadow-blue-500/25 border-0 transition-all active:scale-[0.98]"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Redefinindo...
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
