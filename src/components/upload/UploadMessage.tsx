/**
 * Componente genérico para mensagens de status de upload
 */

import { CheckCircle2, XCircle, Info } from 'lucide-react';

interface UploadMessageProps {
  message: string;
  variant?: 'default' | 'marketing' | 'valores';
}

export function UploadMessage({ message }: UploadMessageProps) {
  if (!message) return null;

  const isSuccess = message.includes('✅');
  const isError = message.includes('❌');

  const styles = isSuccess
    ? 'border-emerald-200 bg-emerald-50/80 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300'
    : isError
    ? 'border-rose-200 bg-rose-50/80 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300'
    : 'border-blue-200 bg-blue-50/80 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300';

  const Icon = isSuccess ? CheckCircle2 : isError ? XCircle : Info;
  const iconColor = isSuccess ? 'text-emerald-500' : isError ? 'text-rose-500' : 'text-blue-500';
  const cleanMsg = message.replace(/[✅❌ℹ️]/g, '').trim();

  return (
    <div className={`flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 rounded-xl border p-3.5 duration-300 ${styles}`}>
      <Icon className={`h-4 w-4 ${iconColor} flex-shrink-0 mt-0.5`} />
      <p className="text-sm font-medium leading-relaxed">{cleanMsg}</p>
    </div>
  );
}
