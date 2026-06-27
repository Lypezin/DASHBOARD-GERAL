/** Converte formato HH:MM:SS ou número para horas decimais */
export function converterHorasParaDecimal(valor: string | number): number {
    if (typeof valor === 'number') return valor;
    if (!valor || valor === '0' || valor === '00:00:00') return 0;

    // Se já for um número decimal (string)
    if (!valor.includes(':')) {
        const num = parseFloat(valor);
        return isNaN(num) ? 0 : num;
    }

    const parts = valor.split(':');
    if (parts.length === 3) {
        const h = parseInt(parts[0]) || 0, m = parseInt(parts[1]) || 0, s = parseInt(parts[2]) || 0;
        return h + m / 60 + s / 3600;
    }
    if (parts.length === 2) {
        const h = parseInt(parts[0]) || 0, m = parseInt(parts[1]) || 0;
        return h + m / 60;
    }

    return 0;
}

export function formatarHorasParaHMS(horasDecimais: string | number): string {
    if (typeof horasDecimais === 'string' && horasDecimais.includes(':')) return horasDecimais;

    const horas = typeof horasDecimais === 'string' ? parseFloat(horasDecimais) : horasDecimais;

    if (isNaN(horas) || horas === 0) return '00:00:00';

    const horasInteiras = Math.floor(horas), minutosDecimais = (horas - horasInteiras) * 60;
    const minutosInteiros = Math.floor(minutosDecimais), segundos = Math.round((minutosDecimais - minutosInteiros) * 60);
    return `${String(horasInteiras).padStart(2, '0')}:${String(minutosInteiros).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

export function formatarHorasCompacta(horasDecimais: string | number): string {
    let horas: number;
    if (typeof horasDecimais === 'string' && horasDecimais.includes(':')) {
        const parts = horasDecimais.split(':');
        if (parts.length === 3) {
            const h = parseInt(parts[0]) || 0, m = parseInt(parts[1]) || 0, s = parseInt(parts[2]) || 0;
            horas = h + m / 60 + s / 3600;
        } else horas = parseFloat(horasDecimais) || 0;
    } else horas = typeof horasDecimais === 'string' ? parseFloat(horasDecimais) : horasDecimais;

    if (isNaN(horas) || horas === 0) return '0';

    if (horas >= 1000) {
        const milhares = horas / 1000;
        return `${milhares.toFixed(1)}k`;
    }

    return horas.toFixed(1);
}

export const formatCompactTime = (timeString: string): string => {
    if (!timeString || typeof timeString !== 'string') return '0h';

    const parts = timeString.split(':');
    if (parts.length < 2) return timeString;

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);

    if (isNaN(hours)) return timeString;

    if (hours > 9999) return `${new Intl.NumberFormat('pt-BR').format(hours)}h`;
    if (hours > 999) return `${hours}h`;
    if (minutes > 0 && hours < 100) return `${hours}h${minutes.toString().padStart(2, '0')}`;
    return `${hours}h`;
};

/**
 * Converte segundos totais para formato HH:MM:SS
 */
export function convertSecondsToHHMMSS(totalSeconds: number): string {
    if (!totalSeconds) return '00:00:00';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Alias para manter retrocompatibilidade com chamadas de formatDuration.
 */
export const formatDuration = convertSecondsToHHMMSS;

/**
 * Converte fração de dia (0-1) para formato HH:MM:SS
 */
export function convertFractionToHHMMSS(fraction: number): string {
    const totalSeconds = Math.round(fraction * 86400);
    return convertSecondsToHHMMSS(totalSeconds);
}

/**
 * Verifica se o horário atual é de baixo uso do sistema
 * Madrugada: 2h às 6h ou Fins de semana: Sábado e Domingo
 */
export function isLowUsageTime(): boolean {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  const isWeekend = day === 0 || day === 6;
  const isEarlyMorning = hour >= 2 && hour < 6;

  return isWeekend || isEarlyMorning;
}

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

export function shouldRefreshMVsNow(isManualRefresh: boolean = false): boolean {
  if (isManualRefresh) return true;
  return isLowUsageTime();
}
