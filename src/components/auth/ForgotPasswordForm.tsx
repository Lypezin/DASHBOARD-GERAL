
import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useForgotPassword } from '@/hooks/auth/useForgotPassword';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordForm = React.memo(function ForgotPasswordForm() {
    const [email, setEmail] = useState('');
    const { loading, error, success, requestPasswordReset } = useForgotPassword();

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        requestPasswordReset(email);
    }, [email, requestPasswordReset]);

    const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    }, []);

    if (success) {
        return (
            <div className="text-center space-y-6">
                <div className="flex justify-center">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Email Enviado!</h2>
                    <p className="text-slate-500">
                        Enviamos um link de recuperação para <strong>{email}</strong>.
                        Verifique sua caixa de entrada e spam.
                    </p>
                </div>
                <Link
                    href="/login"
                    className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                    Voltar para o Login
                </Link>
            </div>
        );
    }

    return (
        <>
            <div className="mb-8 text-center">
                <h2 className="mb-2 text-2xl font-bold text-slate-800">Recuperar Senha</h2>
                <p className="text-sm font-medium text-slate-500">
                    Digite seu email para receber o link de redefinição
                </p>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-700">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-600 font-medium">Email</Label>
                    <div className="relative group">
                        <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 transition duration-300 group-hover:opacity-20 blur"></div>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={handleEmailChange}
                                required
                                className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm"
                                placeholder="seu@email.com"
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white h-11 px-8 shadow-lg shadow-blue-500/25 border-0 transition-all active:scale-[0.98]"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando...
                        </>
                    ) : (
                        <>
                            Enviar Link
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            </form>

            <div className="text-center mt-6">
                <Link
                    href="/login"
                    className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                >
                    Voltar para o Login
                </Link>
            </div>
        </>
    );
});

ForgotPasswordForm.displayName = 'ForgotPasswordForm';
