import React from 'react';
import { AlertCircle } from 'lucide-react';

interface DedicadoInlineNoticeProps {
  message: string;
}

export function DedicadoInlineNotice({ message }: DedicadoInlineNoticeProps) {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="font-semibold">{message}</p>
    </div>
  );
}

export default DedicadoInlineNotice;
