import { useMemo } from 'react';
import { AderenciaSemanal } from '@/types';
import type { Filters } from '@/types/filters';

interface ParsedWeek {
    week: number;
    year?: number;
}

const WEEK_LABEL_RE = /(?:^|[^\d])W?(\d{1,2})(?:$|[^\d])/i;

function getIsoWeekInfo(date = new Date()) {
    const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNumber = target.getUTCDay() || 7;
    target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
    const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

    return { year: target.getUTCFullYear(), week };
}

function getIsoWeeksInYear(year: number) {
    return getIsoWeekInfo(new Date(Date.UTC(year, 11, 28))).week;
}

function toWeekKey(year: number, week: number) {
    return `${year}-W${String(week).padStart(2, '0')}`;
}

function parseWeekValue(value: unknown): ParsedWeek | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return { week: value };
    }

    if (typeof value !== 'string') return null;

    const yearMatch = value.match(/(20\d{2}|19\d{2})/);
    const weekMatch = value.match(/W(\d{1,2})/i) || value.match(WEEK_LABEL_RE);
    if (!weekMatch) return null;

    const week = Number(weekMatch[1]);
    if (!Number.isInteger(week) || week < 1 || week > 53) return null;

    return {
        week,
        year: yearMatch ? Number(yearMatch[1]) : undefined
    };
}

function getLatestAvailableWeek(
    targetYear: number,
    aderenciaSemanal?: AderenciaSemanal[]
) {
    const currentIso = getIsoWeekInfo();
    const maxAllowedWeek = targetYear === currentIso.year
        ? currentIso.week
        : getIsoWeeksInYear(targetYear);

    const candidates = (aderenciaSemanal || [])
        .map(item => parseWeekValue(item.semana))
        .filter((weekInfo): weekInfo is ParsedWeek => {
            if (!weekInfo) return false;
            if (weekInfo.year && weekInfo.year !== targetYear) return false;
            return weekInfo.week >= 1 && weekInfo.week <= maxAllowedWeek;
        })
        .map(weekInfo => weekInfo.week);

    if (candidates.length === 0) return null;
    return Math.max(...candidates);
}

export function useTargetWeeks(filters: Filters, aderenciaSemanal?: AderenciaSemanal[]) {
    return useMemo(() => {
        const targetYear = filters.ano || getIsoWeekInfo().year;
        const selectedWeeks = (filters.semanas || [])
            .map(Number)
            .filter(week => Number.isInteger(week) && week >= 1 && week <= 53);

        const targetWeek = selectedWeeks.length > 0
            ? Math.max(...selectedWeeks)
            : filters.semana || getLatestAvailableWeek(targetYear, aderenciaSemanal);

        if (!targetWeek) return null;

        const previousYear = targetWeek > 1 ? targetYear : targetYear - 1;
        const previousWeek = targetWeek > 1 ? targetWeek - 1 : getIsoWeeksInYear(previousYear);

        return {
            current: toWeekKey(targetYear, targetWeek),
            previous: toWeekKey(previousYear, previousWeek),
            currentLabel: `Semana ${targetWeek}`,
            previousLabel: `Semana ${previousWeek}`
        };
    }, [filters.semanas, filters.semana, filters.ano, aderenciaSemanal]);
}
