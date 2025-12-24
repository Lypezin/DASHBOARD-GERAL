
import React from 'react';
import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatWeekLabel } from '@/utils/timeHelpers';

interface EntradaSaidaHeaderProps {
    semana: string;
    isFirst: boolean;
}

export const EntradaSaidaHeader: React.FC<EntradaSaidaHeaderProps> = ({ semana, isFirst }) => {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isFirst
                    ? 'bg-indigo-100 dark:bg-indigo-900/40'
                    : 'bg-slate-100 dark:bg-slate-800'
                    }`}>
                    <Calendar className={`h-4 w-4 ${isFirst ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
                        }`} />
                </div>
                <div>
                    <p className={`font-semibold text-sm ${isFirst ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-900 dark:text-slate-100'
                        }`}>
                        {formatWeekLabel(semana)}
                    </p>
                </div>
            </div>
            {isFirst && (
                <Badge className="bg-indigo-100 text-indigo-700 border-0 dark:bg-indigo-900/40 dark:text-indigo-300 text-[10px] px-2">
                    Atual
                </Badge>
            )}
        </div>
    );
};
