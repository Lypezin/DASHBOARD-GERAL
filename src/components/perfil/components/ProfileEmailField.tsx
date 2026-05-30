import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Mail } from 'lucide-react';

interface ProfileEmailFieldProps {
  email: string;
}

export const ProfileEmailField: React.FC<ProfileEmailFieldProps> = ({ email }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="email" className="text-sm font-bold text-slate-800 dark:text-slate-100">
        E-mail
      </Label>
      <div className="relative">
        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
        <Input
          id="email"
          value={email}
          readOnly
          disabled
          className="rounded-xl border-slate-200 bg-slate-50/80 pl-10 font-medium text-slate-600 disabled:opacity-100 dark:border-slate-800 dark:bg-slate-900/55 dark:text-slate-300"
        />
      </div>
      <p className="pl-1 text-xs font-medium text-slate-500 dark:text-slate-400">
        O e-mail não pode ser alterado.
      </p>
    </div>
  );
};
