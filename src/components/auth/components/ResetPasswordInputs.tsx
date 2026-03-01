import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { PasswordStrengthIndicator } from '@/components/registro/PasswordStrengthIndicator';

interface ResetPasswordInputsProps {
    password: string;
    setPassword: (value: string) => void;
    confirmPassword: string;
    setConfirmPassword: (value: string) => void;
    showPassword: boolean;
    setShowPassword: (value: boolean) => void;
    showConfirmPassword: boolean;
    setShowConfirmPassword: (value: boolean) => void;
    loading: boolean;
    passwordStrength: {
        strength: number;
        label: string;
        color: string;
    };
}

export const ResetPasswordInputs = React.memo(function ResetPasswordInputs({
    password, setPassword, confirmPassword, setConfirmPassword, showPassword,
    setShowPassword, showConfirmPassword, setShowConfirmPassword, loading, passwordStrength
}: ResetPasswordInputsProps) {
    return (
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
    );
});

ResetPasswordInputs.displayName = 'ResetPasswordInputs';
