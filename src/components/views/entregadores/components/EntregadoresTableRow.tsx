
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin } from 'lucide-react';
import { EntregadorMarketing } from '@/types';

interface EntregadoresTableRowProps {
    entregador: EntregadorMarketing;
    formatarSegundosParaHoras: (segundos: number) => string;
}

export const EntregadoresTableRow: React.FC<EntregadoresTableRowProps> = ({ entregador, formatarSegundosParaHoras }) => {
    // Lógica de status: usar campo do banco se existir, senão fallback para regra de completadas
    let statusTexto = 'Não';
    let isRodando = false;

    if (entregador.rodando) {
        // Se vier do banco (Sim/Não)
        isRodando = entregador.rodando === 'Sim';
        statusTexto = isRodando ? 'Rodando' : 'Não';
    } else {
        // Fallback
        isRodando = entregador.total_completadas > 30;
        statusTexto = isRodando ? 'Rodando' : 'Não';
    }

    return (
        <div
            className="grid grid-cols-10 gap-4 px-6 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors min-w-[1200px]"
        >
            <div className="col-span-2">
                <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {entregador.nome}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate flex items-center gap-1">
                    {entregador.id_entregador.substring(0, 8)}...
                </div>
            </div>

            <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                <MapPin className="h-3 w-3" />
                {entregador.regiao_atuacao || 'N/A'}
            </div>

            <div className="text-right text-sm text-slate-600 dark:text-slate-400 font-mono">
                {(entregador.total_ofertadas || 0).toLocaleString('pt-BR')}
            </div>

            <div className="text-right text-sm text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                {(entregador.total_aceitas || 0).toLocaleString('pt-BR')}
            </div>

            <div className="text-right text-sm text-blue-600 dark:text-blue-400 font-mono font-medium">
                {(entregador.total_completadas || 0).toLocaleString('pt-BR')}
            </div>

            <div className="text-right text-sm text-rose-600 dark:text-rose-400 font-mono font-medium">
                {(entregador.total_rejeitadas || 0).toLocaleString('pt-BR')}
            </div>

            <div className="text-right text-sm text-indigo-600 dark:text-indigo-400 font-mono flex items-center justify-end gap-1">
                <Clock className="h-3 w-3" />
                {formatarSegundosParaHoras(entregador.total_segundos || 0)}
            </div>

            <div className="text-center">
                <Badge
                    variant="outline"
                    className={`font-medium ${entregador.dias_sem_rodar === null || entregador.dias_sem_rodar === undefined
                        ? 'text-slate-500 border-slate-200 bg-slate-50'
                        : entregador.dias_sem_rodar === 0
                            ? 'text-emerald-600 border-emerald-200 bg-emerald-50'
                            : entregador.dias_sem_rodar <= 3
                                ? 'text-amber-600 border-amber-200 bg-amber-50'
                                : 'text-rose-600 border-rose-200 bg-rose-50'
                        }`}
                >
                    {entregador.dias_sem_rodar === null || entregador.dias_sem_rodar === undefined
                        ? 'N/A'
                        : entregador.dias_sem_rodar === 0
                            ? 'Hoje'
                            : `${entregador.dias_sem_rodar} dia${entregador.dias_sem_rodar !== 1 ? 's' : ''}`
                    }
                </Badge>
            </div>

            <div className="text-center">
                <Badge
                    variant={isRodando ? "default" : "secondary"}
                    className={isRodando ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                >
                    {statusTexto}
                </Badge>
            </div>
        </div>
    );
};
