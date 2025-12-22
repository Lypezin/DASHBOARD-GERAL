/**
 * Converte segundos totais para formato HH:MM:SS
 * @param totalSeconds Total de segundos
 * @returns String no formato HH:MM:SS
 */
export function convertSecondsToHHMMSS(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Converte fração de dia (0-1) para formato HH:MM:SS
 * @param fraction Fração de dia (0.5 = meio dia = 12:00:00)
 * @returns String no formato HH:MM:SS
 */
export function convertFractionToHHMMSS(fraction: number): string {
    const totalSeconds = Math.round(fraction * 86400);
    return convertSecondsToHHMMSS(totalSeconds);
}
