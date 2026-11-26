import { ArrowUpRight, ArrowDownRight, RotateCcw } from 'lucide-react';

export function getMetricDialogConfig(type: 'entradas' | 'saidas' | 'retomada') {
    const isEntrada = type === 'entradas';
    const isRetomada = type === 'retomada';

    let colorClass = isEntrada ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
    let hoverTextClass = isEntrada ? 'hover:text-emerald-700 dark:hover:text-emerald-300' : 'hover:text-rose-700 dark:hover:text-rose-300';
    let hoverBgClass = isEntrada ? 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'hover:bg-rose-50 dark:hover:bg-rose-900/20';
    let Icon = isEntrada ? ArrowUpRight : ArrowDownRight;
    let titleText = isEntrada ? 'Entradas' : 'Sa\u00eddas';
    let descriptionText = isEntrada ? 'entregadores ativos nesta semana.' : 'entregadores inativos nesta semana.';

    if (isRetomada) {
        colorClass = 'text-sky-600 dark:text-sky-400';
        hoverTextClass = 'hover:text-sky-700 dark:hover:text-sky-300';
        hoverBgClass = 'hover:bg-sky-50 dark:hover:bg-sky-900/20';
        Icon = RotateCcw;
        titleText = 'Retomada';
        descriptionText = 'entregadores que retornaram \u00e0 base nesta semana.';
    }

    return {
        colorClass,
        hoverTextClass,
        hoverBgClass,
        Icon,
        titleText,
        descriptionText,
        isEntrada,
    };
}
