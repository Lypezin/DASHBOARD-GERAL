/**
 * Componente de mensagem de status para upload de corridas
 */

interface CorridasUploadMessageProps {
  message: string;
}

export function CorridasUploadMessage({ message }: CorridasUploadMessageProps) {
  if (!message) {
    return null;
  }

  const getMessageStyles = () => {
    if (message.includes('✅')) {
      return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200';
    }
    if (message.includes('❌')) {
      return 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200';
    }
    return 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200';
  };

  return (
    <div
      className={`mt-6 animate-in fade-in slide-in-from-top-2 rounded-xl border-2 p-4 duration-300 ${getMessageStyles()}`}
    >
      <p className="font-medium">{message}</p>
    </div>
  );
}

