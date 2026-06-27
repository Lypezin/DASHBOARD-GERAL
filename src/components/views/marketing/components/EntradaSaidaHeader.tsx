import React from 'react';
import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatWeekLabel } from '@/utils/formatters/dateUtils';

interface EntradaSaidaHeaderProps {
    semana: string;
    isFirst: boolean;
}

export const EntradaSaidaHeader: React.FC<EntradaSaidaHeaderProps> = ({ semana, isFirst }) => {
    return (
        <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        isFirst ? 'bg-sky-100 dark:bg-sky-900/30' : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                >
                    <Calendar className={`h-4 w-4 ${isFirst ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500'}`} />
                </div>
                <div>
                    <p
                        className={`text-sm font-semibold ${
                            isFirst ? 'text-sky-950 dark:text-sky-100' : 'text-slate-900 dark:text-slate-100'
                        }`}
                    >
                        {formatWeekLabel(semana)}
                        <span className="ml-1 text-xs font-normal opacity-60">
                            &apos;{(semana.split('-')[0] || '').slice(2)}
                        </span>
                    </p>
                </div>
            </div>
            {isFirst && (
                <Badge className="border-0 bg-sky-100 px-2 text-[10px] text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                    Atual
                </Badge>
            )}
        </div>
    );
};
