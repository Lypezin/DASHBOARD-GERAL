'use client';

import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export type HealthGrade = 'A' | 'B' | 'C' | 'D';

export interface HealthScore {
    score: number;
    grade: HealthGrade;
}

const gradeConfig: Record<HealthGrade, { bg: string; text: string; label: string }> = {
    A: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', label: 'Excelente' },
    B: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300', label: 'Bom' },
    C: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300', label: 'Regular' },
    D: { bg: 'bg-rose-100 dark:bg-rose-900/40', text: 'text-rose-700 dark:text-rose-300', label: 'Crítico' },
};

export function calculateHealthScore(
    aderenciaPercentual: number,
    corridasCompletadas: number,
    corridasOfertadas: number,
    totalSegundos: number,
): HealthScore {
    const aderenciaScore = Math.min(aderenciaPercentual / 100, 1);
    const completudeScore = corridasOfertadas > 0 ? Math.min(corridasCompletadas / corridasOfertadas, 1) : 0;
    const horasScore = Math.min(totalSegundos / (40 * 3600), 1); // 40h como referência

    const score = Math.round((aderenciaScore * 40 + completudeScore * 30 + horasScore * 30));

    let grade: HealthGrade = 'D';
    if (score >= 80) grade = 'A';
    else if (score >= 60) grade = 'B';
    else if (score >= 40) grade = 'C';

    return { score, grade };
}

interface HealthBadgeProps {
    grade: HealthGrade;
    score: number;
    size?: 'sm' | 'md';
}

export const HealthBadge = React.memo(function HealthBadge({ grade, score, size = 'sm' }: HealthBadgeProps) {
    const config = gradeConfig[grade];
    const sizeClass = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className={`inline-flex items-center justify-center rounded-full font-bold ${sizeClass} ${config.bg} ${config.text} cursor-help`}>
                    {grade}
                </span>
            </TooltipTrigger>
            <TooltipContent>
                <p className="font-medium">{config.label} — Score: {score}/100</p>
                <p className="text-xs text-muted-foreground">Aderência 40% + Completude 30% + Horas 30%</p>
            </TooltipContent>
        </Tooltip>
    );
});
