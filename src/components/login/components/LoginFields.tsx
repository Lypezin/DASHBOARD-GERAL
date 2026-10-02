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
                <Label htmlFor="email" className="text-slate-600 font-medium">Email</Label>
                <div className="group relative min-w-0">
                    <div className="relative min-w-0">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-[#0754d8]" />
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={onEmailChange}
                            required
                            className="border-input bg-background pl-9 text-foreground shadow-none placeholder:text-muted-foreground focus:border-[#0754d8] focus:ring-[#0754d8]/20"
                            placeholder="seu@email.com"
                            disabled={loading}
                        />
                    </div>
                </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-600 font-medium">Senha</Label>
                <div className="group relative min-w-0">
                    <div className="relative min-w-0">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-[#0754d8]" />
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={onPasswordChange}
                            required
                            className="border-input bg-background pl-9 pr-10 text-foreground shadow-none placeholder:text-muted-foreground focus:border-[#0754d8] focus:ring-[#0754d8]/20"
                            placeholder="••••••••"
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={onTogglePassword}
                            className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    <div className="flex justify-end pt-1 relative z-10">
                        <Link
                            href="/esqueci-senha"
                            className="text-xs font-medium text-[#0754d8] transition-colors hover:text-[#0647b7]"
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
