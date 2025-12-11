/**
 * Funções utilitárias para verificação de horários e datas
 * Útil para otimizações de performance (ex: refresh de MVs em horários de baixo uso)
 */

/**
 * Verifica se o horário atual é de baixo uso do sistema
 * 
 * Horários de baixo uso:
 * - Madrugada: 2h às 6h
 * - Fins de semana: Sábado e Domingo
 * 
 * @returns true se é horário de baixo uso, false caso contrário
 */
export function isLowUsageTime(): boolean {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = domingo, 6 = sábado

  // Horários de baixo uso: 2h-6h (madrugada) ou fins de semana
  const isWeekend = day === 0 || day === 6;
  const isEarlyMorning = hour >= 2 && hour < 6;

  return isWeekend || isEarlyMorning;
}

/**
 * Retorna uma mensagem descritiva sobre o horário atual
 * 
 * @returns String descrevendo o horário atual
 */
export function getTimeContextMessage(): string {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  const dayNames = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

  const dayName = dayNames[day];
  const isLowUsage = isLowUsageTime();

  if (isLowUsage) {
    if (now.getDay() === 0 || now.getDay() === 6) {
      return `Fim de semana (${dayName}) - Horário de baixo uso`;
    }
    return `Madrugada (${hour}h) - Horário de baixo uso`;
  }

  return `${dayName}, ${hour}h - Horário normal`;
}

/**
 * Verifica se é recomendado fazer refresh de Materialized Views agora
 * 
 * Retorna true se:
 * - É horário de baixo uso, OU
 * - É uma operação manual (forçada pelo usuário)
 * 
 * @param isManualRefresh Se o refresh foi iniciado manualmente pelo usuário
 * @returns true se é recomendado fazer refresh agora
 */
export function shouldRefreshMVsNow(isManualRefresh: boolean = false): boolean {
  // Se é refresh manual, sempre permitir (usuário sabe o que está fazendo)
  if (isManualRefresh) {
    return true;
  }

  // Para refresh automático, só fazer em horário de baixo uso
  return isLowUsageTime();
}

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

