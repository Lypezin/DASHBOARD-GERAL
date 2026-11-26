import React from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

interface LoginFieldsProps {
    email: string;
    onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    password: string;
    onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    showPassword: boolean;
    onTogglePassword: () => void;
    loading: boolean;
}

export const LoginFields = React.memo(function LoginFields({
    email,
    onEmailChange,
    password,
    onPasswordChange,
    showPassword,
    onTogglePassword,
    loading
}: LoginFieldsProps) {
    return (
        <>
            {/* Email Field */}
            <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-600 dark:text-slate-300 font-medium">Email</Label>
                <div className="group relative min-w-0">
                    <div className="pointer-events-none absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 transition duration-300 group-hover:opacity-20 blur"></div>
                    <div className="relative min-w-0">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={onEmailChange}
                            required
                            className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
                            placeholder="seu@email.com"
                            disabled={loading}
                        />
                    </div>
                </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-600 dark:text-slate-300 font-medium">Senha</Label>
                <div className="min-w-0">
                    <div className="group relative min-w-0">
                        <div className="pointer-events-none absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 transition duration-300 group-hover:opacity-20 blur"></div>
                        <div className="relative min-w-0">
                            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={onPasswordChange}
                                required
                                className="pl-9 pr-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
                                placeholder="••••••••"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={onTogglePassword}
                                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-end pt-1.5 relative z-10">
                        <Link
                            href="/esqueci-senha"
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        >
                            Esqueci minha senha
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
});

LoginFields.displayName = 'LoginFields';
