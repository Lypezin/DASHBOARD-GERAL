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

    const handleSubmit = useCallback((e: React.FormEvent) => { e.preventDefault(); requestPasswordReset(email); }, [email, requestPasswordReset]);
    const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value), []);

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
                <Link href="/login" className="inline-flex w-full items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium text-[#0754d8] transition-colors hover:bg-muted">Voltar para o Login</Link>
            </div>
        );
    }

    return (
        <>
            <div className="mb-8 text-left">
                <h1 className="mb-1 text-3xl font-bold tracking-tight text-foreground">Recuperar Senha</h1>
                <p className="text-sm text-muted-foreground">Digite seu email para receber o link de redefinição</p>
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
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-[#0754d8]" />
                            <Input id="email" type="email" value={email} onChange={handleEmailChange} required className="border-input bg-background pl-9 text-foreground shadow-none placeholder:text-muted-foreground focus:border-[#0754d8] focus:ring-[#0754d8]/20" placeholder="seu@email.com" disabled={loading} />
                        </div>
                    </div>
                </div>

                <Button type="submit" disabled={loading} className="h-11 w-full border-0 bg-[#0754d8] px-8 text-white shadow-sm transition-colors hover:bg-[#0647b7] active:scale-[0.98]">
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : <><ArrowRight className="ml-2 h-4 w-4" /> Enviar Link</>}
                </Button>
            </form>

            <div className="mt-7 border-t border-border pt-5 text-center">
                <Link
                    href="/login"
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    Voltar para o Login
                </Link>
            </div>
        </>
    );
});

ForgotPasswordForm.displayName = 'ForgotPasswordForm';
