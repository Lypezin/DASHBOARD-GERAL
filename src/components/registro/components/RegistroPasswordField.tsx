import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { PasswordStrengthIndicator } from '../PasswordStrengthIndicator';

interface RegistroPasswordFieldProps {
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    showPassword: boolean;
    onToggleShowPassword: () => void;
    placeholder?: string;
    loading?: boolean;
    strength?: { strength: number; label: string; color: string };
    confirmMatch?: boolean;
}

export const RegistroPasswordField: React.FC<RegistroPasswordFieldProps> = React.memo(({
    id,
    label,
    value,
    onChange,
    showPassword,
    onToggleShowPassword,
    placeholder = '••••••••',
    loading,
    strength,
    confirmMatch
}) => (
    <div className="space-y-2">
        <Label htmlFor={id} className="text-slate-600 font-medium">{label}</Label>
        <div className="relative group">
            <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 transition duration-300 group-hover:opacity-20 blur"></div>
            <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <Input
                    id={id}
                    type={showPassword ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    required
                    minLength={6}
                    className="pl-9 pr-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm"
                    placeholder={placeholder}
                    disabled={loading}
                />
                <button
                    type="button"
                    onClick={onToggleShowPassword}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
        </div>
        {strength && (
            <div className="pt-1">
                <PasswordStrengthIndicator
                    password={value}
                    strength={strength.strength}
                    label={strength.label}
                    color={strength.color}
                />
            </div>
        )}
        {confirmMatch !== undefined && value.length > 0 && (
            <div className={`text-xs font-medium mt-1 ${confirmMatch ? 'text-emerald-600' : 'text-rose-500'}`}>
                {confirmMatch ? '✓ Senhas coincidem' : 'As senhas não coincidem'}
            </div>
        )}
    </div>
));

RegistroPasswordField.displayName = 'RegistroPasswordField';
