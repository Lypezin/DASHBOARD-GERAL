import { ArrowUpRight, ArrowDownRight, RotateCcw } from 'lucide-react';

export function getMetricDialogConfig(type: 'entradas' | 'saidas' | 'retomada') {
    const isEntrada = type === 'entradas';
    const isRetomada = type === 'retomada';

    let colorClass = isEntrada ? 'text-emerald-600' : 'text-rose-600';
    let hoverBgClass = isEntrada ? 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'hover:bg-rose-50 dark:hover:bg-rose-900/20';
    let Icon = isEntrada ? ArrowUpRight : ArrowDownRight;
    let titleText = isEntrada ? 'Entradas' : 'Saídas';
    let descriptionText = isEntrada ? 'entregadores ativos nesta semana.' : 'entregadores inativos nesta semana.';

    if (isRetomada) {
        colorClass = 'text-indigo-600';
        hoverBgClass = 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20';
        Icon = RotateCcw;
        titleText = 'Retomada';
        descriptionText = 'entregadores que retornaram à base nesta semana.';
    }

    return {
        colorClass,
        hoverBgClass,
        Icon,
        titleText,
        descriptionText,
        isEntrada
    };
}
