import React from 'react';
import { Entregador } from '@/types';
import { Badge } from '@/components/ui/badge';
import { calcularPercentualAceitas, calcularPercentualCompletadas } from '../EntregadoresUtils';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { calculateHealthScore, HealthBadge } from '@/components/ui/HealthBadge';
import { ENTREGADORES_OVERVIEW_TABLE_GRID, ENTREGADORES_TABLE_GRID } from './EntregadoresMainTableHeader';

interface EntregadoresTableRowProps {
    entregador: Entregador;
    onClick?: (entregador: Entregador) => void;
    variant?: 'entregadores' | 'dedicado';
}

export const EntregadoresMainTableRow = React.memo(function EntregadoresMainTableRow({
    entregador,
    onClick,
    variant = 'entregadores',
}: EntregadoresTableRowProps) {
    const horas = (entregador.total_segundos || 0) / 3600;
    const hs = calculateHealthScore(
        entregador.aderencia_percentual,
        entregador.corridas_completadas,
        entregador.corridas_ofertadas,
        entregador.total_segundos
    );
    const aderencia = entregador.aderencia_percentual || 0;
    const horasLabel = formatarHorasParaHMS(horas);
    const gridClass = variant === 'entregadores' ? ENTREGADORES_OVERVIEW_TABLE_GRID : ENTREGADORES_TABLE_GRID;
    const isEntregadores = variant === 'entregadores';

    return (
        <div
            className={`grid ${gridClass} ${isEntregadores ? 'min-h-[68px] gap-3 px-5 py-2.5' : 'min-h-[72px] gap-4 px-6 py-4'} ${onClick && !isEntregadores ? 'cursor-pointer' : 'cursor-default'} items-center transition-colors ${isEntregadores
                ? 'duration-150 hover:bg-[#f2f8fb] dark:hover:bg-sky-950/20'
                : 'hover:bg-slate-50/90 dark:hover:bg-slate-900/70'
                }`}
            style={{ contentVisibility: 'auto', containIntrinsicSize: isEntregadores ? '68px' : '72px' }}
            onClick={isEntregadores ? undefined : () => onClick?.(entregador)}
        >
            {!isEntregadores && <div className="flex justify-center"><HealthBadge grade={hs.grade} score={hs.score} /></div>}

            <div className="min-w-0">
                {isEntregadores ? (
                    <button
                        type="button"
                        onClick={() => onClick?.(entregador)}
                        disabled={!onClick}
                        aria-haspopup="dialog"
                        className="block max-w-full truncate text-left text-[14px] font-semibold text-[#173f5a] transition-colors hover:text-[#0877b4] hover:underline hover:underline-offset-4 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 disabled:cursor-default dark:text-sky-100 dark:hover:text-sky-300"
                        title={`Abrir perfil de ${entregador.nome_entregador}`}
                    >
                        {entregador.nome_entregador}
                    </button>
                ) : (
                    <div className="truncate text-sm font-bold text-slate-950 dark:text-white" title={entregador.nome_entregador}>
                        {entregador.nome_entregador}
                    </div>
                )}
                <div className={variant === 'entregadores' ? 'truncate text-xs font-medium text-slate-500 dark:text-slate-400' : 'truncate font-mono text-xs font-medium text-slate-500 dark:text-slate-400'} title={entregador.id_entregador}>
                    {entregador.id_entregador}
                </div>
            </div>

            <div className={variant === 'entregadores'
                ? 'whitespace-nowrap text-center text-[13px] font-medium text-[#4f5c53] tabular-nums dark:text-slate-300'
                : 'whitespace-nowrap text-center font-mono text-sm font-semibold text-slate-700 tabular-nums dark:text-slate-300'} title={horasLabel}>
                {horasLabel}
            </div>
            <NumericCell value={entregador.corridas_ofertadas || 0} variant={variant} />
            <NumericCell value={entregador.corridas_aceitas || 0} variant={variant} />
            {variant === 'entregadores'
                ? <PercentValue value={calcularPercentualAceitas(entregador)} tone="blue" />
                : <PercentBadge value={calcularPercentualAceitas(entregador)} tone="blue" />}
            <NumericCell value={entregador.corridas_completadas || 0} variant={variant} />
            {variant === 'entregadores'
                ? <PercentValue value={calcularPercentualCompletadas(entregador)} tone="emerald" />
                : <PercentBadge value={calcularPercentualCompletadas(entregador)} tone="emerald" />}
            {variant === 'entregadores'
                ? <PercentValue value={aderencia} tone={aderencia >= 90 ? 'emerald' : aderencia >= 70 ? 'blue' : 'rose'} strong />
                : <PercentBadge value={aderencia} tone={aderencia >= 90 ? 'emerald' : aderencia >= 70 ? 'blue' : 'rose'} strong />}
        </div>
    );
});

function NumericCell({ value, variant }: { value: number; variant: 'entregadores' | 'dedicado' }) {
    const label = value.toLocaleString('pt-BR');
    return (
        <div className={variant === 'entregadores'
            ? 'whitespace-nowrap text-right text-[13px] font-medium text-[#4f5c53] tabular-nums dark:text-slate-300'
            : 'whitespace-nowrap text-right text-sm font-semibold text-slate-700 tabular-nums dark:text-slate-300'} title={label}>
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

function PercentValue({ value, tone, strong = false }: { value: number; tone: 'emerald' | 'blue' | 'rose'; strong?: boolean }) {
    const toneClass = {
        emerald: 'text-[#315c49] dark:text-emerald-200',
        blue: 'text-[#526f82] dark:text-sky-200',
        rose: 'text-[#936653] dark:text-rose-200',
    }[tone];

    return (
        <div className={strong ? 'flex flex-col items-end gap-1.5' : 'text-center'}>
            <span className={`whitespace-nowrap text-[13px] tabular-nums ${strong ? 'font-semibold' : 'font-medium'} ${toneClass}`}>
                {value.toFixed(1)}%
            </span>
            {strong && (
                <span
                    className="h-1 w-[76px] overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700"
                    role="meter"
                    aria-label="Aderência"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))}
                >
                    <span
                        className={`block h-full rounded-full transition-[width] duration-300 ${value < 70 ? 'bg-rose-500' : value < 80 ? 'bg-amber-500' : 'bg-[#2586b7]'}`}
                        style={{ width: `${Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))}%` }}
                    />
                </span>
            )}
        </div>
    );
}

EntregadoresMainTableRow.displayName = 'EntregadoresMainTableRow';
