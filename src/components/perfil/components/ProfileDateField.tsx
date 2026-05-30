import React from 'react';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';

interface ProfileDateFieldProps {
  date: string | null;
  label: string;
}

export const ProfileDateField: React.FC<ProfileDateFieldProps> = ({ date, label }) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  if (!date) return null;

  return (
    <div className="space-y-2">
      <Label className="text-sm font-bold text-slate-800 dark:text-slate-100">{label}</Label>
      <div className="relative">
        <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
        <div className="flex h-10 w-full items-center rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 pl-10 text-sm font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900/55 dark:text-slate-300">
          {formatDate(date)}
        </div>
      </div>
    </div>
  );
};
