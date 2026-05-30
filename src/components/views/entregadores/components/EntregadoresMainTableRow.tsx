import React from 'react';
import { Entregador } from '@/types';
import { Badge } from '@/components/ui/badge';
import { calcularPercentualAceitas, calcularPercentualCompletadas } from '../EntregadoresUtils';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { calculateHealthScore, HealthBadge } from '@/components/ui/HealthBadge';
import { ENTREGADORES_TABLE_GRID } from './EntregadoresMainTableHeader';

interface EntregadoresTableRowProps {
    entregador: Entregador;
    onClick?: (entregador: Entregador) => void;
}

export const EntregadoresMainTableRow = React.memo(function EntregadoresMainTableRow({
    entregador,
    onClick,
}: EntregadoresTableRowProps) {
    const horas = (entregador.total_segundos || 0) / 3600;
    const hs = calculateHealthScore(
        entregador.aderencia_percentual,
        entregador.corridas_completadas,
        entregador.corridas_ofertadas,
        entregador.total_segundos
    );
    const aderencia = entregador.aderencia_percentual || 0;

    return (
        <div
            className={`grid ${ENTREGADORES_TABLE_GRID} min-h-[72px] cursor-pointer items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/90 dark:hover:bg-slate-900/70`}
            onClick={() => onClick?.(entregador)}
        >
            <div className="flex justify-center">
                <HealthBadge grade={hs.grade} score={hs.score} />
            </div>

            <div className="min-w-0">
                <div className="truncate text-sm font-bold text-slate-950 dark:text-white" title={entregador.nome_entregador}>
                    {entregador.nome_entregador}
                </div>
                <div className="truncate font-mono text-xs font-medium text-slate-500 dark:text-slate-400" title={entregador.id_entregador}>
                    {entregador.id_entregador}
                </div>
            </div>

            <div className="whitespace-nowrap text-center font-mono text-sm font-semibold text-slate-700 tabular-nums dark:text-slate-300" title={formatarHorasParaHMS(horas)}>
                {formatarHorasParaHMS(horas)}
            </div>
            <NumericCell value={entregador.corridas_ofertadas || 0} />
            <NumericCell value={entregador.corridas_aceitas || 0} />
            <PercentBadge value={calcularPercentualAceitas(entregador)} tone="blue" />
            <NumericCell value={entregador.corridas_completadas || 0} />
            <PercentBadge value={calcularPercentualCompletadas(entregador)} tone="emerald" />
            <PercentBadge value={aderencia} tone={aderencia >= 90 ? 'emerald' : aderencia >= 70 ? 'blue' : 'rose'} strong />
        </div>
    );
});

function NumericCell({ value }: { value: number }) {
    const label = value.toLocaleString('pt-BR');
    return (
        <div className="whitespace-nowrap text-right text-sm font-semibold text-slate-700 tabular-nums dark:text-slate-300" title={label}>
            {label}
        </div>
    );
}

function PercentBadge({ value, tone, strong = false }: { value: number; tone: 'emerald' | 'blue' | 'rose'; strong?: boolean }) {
    const toneClass = {
        emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-300',
        blue: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/25 dark:text-blue-300',
        rose: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/25 dark:text-rose-300',
    }[tone];

    return (
        <div className="flex justify-center">
            <Badge
                variant="outline"
                className={`whitespace-nowrap rounded-full px-2.5 py-1 font-mono tabular-nums ${strong ? 'font-black' : 'font-semibold'} ${toneClass}`}
            >
                {value.toFixed(1)}%
            </Badge>
        </div>
    );
}

EntregadoresMainTableRow.displayName = 'EntregadoresMainTableRow';
