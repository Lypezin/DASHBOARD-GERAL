import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useForgotPassword } from '@/hooks/auth/useForgotPassword';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ViewTransition } from '@/components/ui/view-transition';

export const ForgotPasswordForm = React.memo(function ForgotPasswordForm() {
    const [email, setEmail] = useState('');
    const { loading, error, success, requestPasswordReset } = useForgotPassword();

    const handleSubmit = useCallback((e: React.FormEvent) => { e.preventDefault(); requestPasswordReset(email); }, [email, requestPasswordReset]);
    const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value), []);

    return (
        <ViewTransition stateKey={success ? 'forgot-success' : 'forgot-form'} preventExitInteraction>
            {success ? (
                <div className="text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                            <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-300" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Email Enviado!</h2>
                        <p className="text-slate-500 dark:text-slate-400">
                            Enviamos um link de recuperação para <strong className="text-slate-700 dark:text-slate-200">{email}</strong>.
                            Verifique sua caixa de entrada e spam.
                        </p>
                    </div>
                    <Link href="/login" className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/35 dark:text-blue-300 dark:hover:bg-blue-950/60 rounded-lg transition-colors">Voltar para o Login</Link>
                </div>
            ) : (
                <>
                    <div className="mb-8 text-center">
                        <h2 className="mb-2 text-2xl font-bold text-slate-800 dark:text-slate-100">Recuperar Senha</h2>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Digite seu email para receber o link de redefinição</p>
                    </div>

                    {error && (
                        <Alert variant="destructive" className="mb-6 bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/35 dark:border-rose-900/50 dark:text-rose-200">
                            <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-300" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-600 dark:text-slate-300 font-medium">Email</Label>
                            <div className="relative group">
                                <div className="pointer-events-none absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 transition duration-300 group-hover:opacity-20 blur"></div>
                                <div className="relative">
                                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <Input id="email" type="email" value={email} onChange={handleEmailChange} required className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" placeholder="seu@email.com" disabled={loading} />
                                </div>
                            </div>
                        </div>

                        <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white h-11 px-8 shadow-lg shadow-blue-500/25 border-0">
                            {loading ? <><Loader2 className="h-4 w-4 motion-safe:animate-spin" /> Enviando...</> : <>Enviar Link <ArrowRight className="h-4 w-4" /></>}
                        </Button>
                    </form>

                    <div className="text-center mt-6">
                        <Link
                            href="/login"
                            className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                        >
                            Voltar para o Login
                        </Link>
                    </div>
                </>
            )}
        </ViewTransition>
    );
});

ForgotPasswordForm.displayName = 'ForgotPasswordForm';
