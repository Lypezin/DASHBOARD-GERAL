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
        <div className="space-y-4">
            {/* Nome Completo */}
            <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-200">Nome Completo</Label>
                <div className="relative group">
                    <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 transition duration-300 group-hover:opacity-20 blur"></div>
                    <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                        <Input
                            id="fullName"
                            type="text"
                            value={fullName}
                            onChange={onFullNameChange}
                            required
                            className="pl-9 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                            placeholder="João da Silva"
                            disabled={loading}
                        />
                    </div>
                </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">Email</Label>
                <div className="relative group">
                    <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 transition duration-300 group-hover:opacity-20 blur"></div>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={onEmailChange}
                            required
                            className="pl-9 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                            placeholder="seu@email.com"
                            disabled={loading}
                        />
                    </div>
                </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">Senha</Label>
                <div className="relative group">
                    <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 transition duration-300 group-hover:opacity-20 blur"></div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={onPasswordChange}
                            required
                            minLength={6}
                            className="pl-9 pr-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                            placeholder="••••••••"
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={onToggleShowPassword}
                            className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors"
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
                <Label htmlFor="confirmPassword" className="text-slate-200">Confirmar Senha</Label>
                <div className="relative group">
                    <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 transition duration-300 group-hover:opacity-20 blur"></div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                        <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={onConfirmPasswordChange}
                            required
                            minLength={6}
                            className="pl-9 pr-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                            placeholder="••••••••"
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={onToggleShowConfirmPassword}
                            className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors"
                        >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
                {confirmPassword.length > 0 && (
                    <div className={`text-xs font-medium mt-1 ${password === confirmPassword ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {password === confirmPassword ? '✓ Senhas coincidem' : 'As senhas não coincidem'}
                    </div>
                )}
            </div>
        </div>
    );
});

RegistroFormInputs.displayName = 'RegistroFormInputs';
