/**
 * Utilitários de manipulação de datas e semanas ISO para o módulo de Marketing.
 */

export const getMondayOfIsoWeek = (date: Date) => {
    const dt = new Date(date);
    const day = (dt.getDay() + 6) % 7; // 0 = Monday, 6 = Sunday
    dt.setDate(dt.getDate() - day);
    dt.setHours(12, 0, 0, 0);
    return dt;
};

export const getIsoWeekInfo = (date: Date) => {
    const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    // Thursday determines the week number in ISO.
    // Shift to Thursday of current week
    tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return { year: tmp.getUTCFullYear(), week: weekNo };
};

export const getWeekKey = (date: Date) => {
    const { year, week } = getIsoWeekInfo(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
};

export const getWeekLabel = (weekKey: string) => {
    const match = weekKey.match(/^-?\d{4}-W(\d{2})$/);
    return match ? `Semana ${match[1]}` : weekKey;
};
