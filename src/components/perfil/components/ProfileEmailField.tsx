import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Mail } from 'lucide-react';

interface ProfileEmailFieldProps {
    email: string;
}

export const ProfileEmailField: React.FC<ProfileEmailFieldProps> = ({ email }) => {
    return (
        <div className="space-y-2">
            <Label htmlFor="email" className="text-base font-semibold">E-mail</Label>
            <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <Input
                    id="email"
                    value={email}
                    readOnly
                    disabled
                    className="pl-10 bg-slate-50 dark:bg-slate-900/50"
                />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 pl-1">
                O e-mail não pode ser alterado.
            </p>
        </div>
    );
};
