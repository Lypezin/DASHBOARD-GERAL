/**
 * Formata segundos para o formato HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  if (!seconds) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Extrai o número da semana de uma string ISO (ex: "2023-W05" -> "05")
 */
export function extractWeekNumber(isoWeek: string) {
  if (!isoWeek) return '';
  return isoWeek.split('-W')[1] || isoWeek;
}

/**
 * Calcula o intervalo de datas (inicio e fim) a partir do ano e numero da semana
 */
export function getDateRangeFromWeek(year: number, week: number) {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dayOfWeek = simple.getDay();
  const isoWeekStart = simple;
  if (dayOfWeek <= 4)
    isoWeekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else
    isoWeekStart.setDate(simple.getDate() + 8 - simple.getDay());

  const isoWeekEnd = new Date(isoWeekStart);
  isoWeekEnd.setDate(isoWeekStart.getDate() + 6);

  return {
    start: isoWeekStart.toISOString().split('T')[0],
    end: isoWeekEnd.toISOString().split('T')[0]
  };
}

/**
 * Formata o label da semana (ex: "2023-W05" -> "Semana 05")
 */
export function formatWeekLabel(semana: string) {
  const match = semana.match(/^(\d{4})-W(\d+)$/);
  if (match) {
    return `Semana ${match[2]}`;
  }
  return semana.replace(/^(\d{2})(\d{2})-W(\d+)$/, 'Semana $3');
}
