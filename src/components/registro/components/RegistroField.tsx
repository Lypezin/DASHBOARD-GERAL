import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail } from 'lucide-react';

interface RegistroFieldProps {
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    placeholder?: string;
    icon?: React.ReactNode;
    loading?: boolean;
    required?: boolean;
}

export const RegistroField: React.FC<RegistroFieldProps> = React.memo(({
    id,
    label,
    value,
    onChange,
    type = 'text',
    placeholder,
    icon,
    loading,
    required
}) => (
    <div className="space-y-2">
        <Label htmlFor={id} className="text-slate-600 font-medium">{label}</Label>
        <div className="relative group">
            <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 transition duration-300 group-hover:opacity-20 blur"></div>
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        {icon}
                    </div>
                )}
                <Input
                    id={id}
                    type={type}
                    value={value}
                    onChange={onChange}
                    required={required}
                    className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm"
                    placeholder={placeholder}
                    disabled={loading}
                />
            </div>
        </div>
    </div>
));

RegistroField.displayName = 'RegistroField';
