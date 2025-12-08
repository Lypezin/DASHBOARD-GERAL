import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { PasswordStrengthIndicator } from '../PasswordStrengthIndicator';

interface RegistroFormInputsProps {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    showPassword: boolean;
    showConfirmPassword: boolean;
    loading: boolean;
    passwordStrength: { strength: number; label: string; color: string };
    onFullNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onConfirmPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onToggleShowPassword: () => void;
    onToggleShowConfirmPassword: () => void;
}

export const RegistroFormInputs: React.FC<RegistroFormInputsProps> = React.memo(({
    fullName,
    email,
    password,
    confirmPassword,
    showPassword,
    showConfirmPassword,
    loading,
    passwordStrength,
    onFullNameChange,
    onEmailChange,
    onPasswordChange,
    onConfirmPasswordChange,
    onToggleShowPassword,
    onToggleShowConfirmPassword,
}) => {
    return (
        <>
            <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={onFullNameChange}
                        required
                        className="pl-9"
                        placeholder="João da Silva"
                        disabled={loading}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={onEmailChange}
                        required
                        className="pl-9"
                        placeholder="seu@email.com"
                        disabled={loading}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={onPasswordChange}
                        required
                        minLength={6}
                        className="pl-9 pr-10"
                        placeholder="••••••••"
                        disabled={loading}
                    />
                    <button
                        type="button"
                        onClick={onToggleShowPassword}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
                <PasswordStrengthIndicator
                    password={password}
                    strength={passwordStrength.strength}
                    label={passwordStrength.label}
                    color={passwordStrength.color}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={onConfirmPasswordChange}
                        required
                        minLength={6}
                        className="pl-9 pr-10"
                        placeholder="••••••••"
                        disabled={loading}
                    />
                    <button
                        type="button"
                        onClick={onToggleShowConfirmPassword}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                    <p className="text-xs font-medium text-rose-500 dark:text-rose-400">As senhas não coincidem</p>
                )}
                {confirmPassword.length > 0 && password === confirmPassword && (
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">✓ Senhas coincidem</p>
                )}
            </div>
        </>
    );
});

RegistroFormInputs.displayName = 'RegistroFormInputs';
