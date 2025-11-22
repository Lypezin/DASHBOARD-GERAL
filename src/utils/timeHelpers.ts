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

