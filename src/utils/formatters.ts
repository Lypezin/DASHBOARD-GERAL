/**
 * Converte formato HH:MM:SS ou número para horas decimais
 * @param valor - String no formato HH:MM:SS ou número (decimal ou string numérica)
 * @returns Número em horas decimais
 */
export function converterHorasParaDecimal(valor: string | number): number {
  if (typeof valor === 'number') return valor;
  if (!valor || valor === '0' || valor === '00:00:00') return 0;

  // Se já for um número decimal (string)
  if (!valor.includes(':')) {
    const num = parseFloat(valor);
    return isNaN(num) ? 0 : num;
  }

  // Se for formato HH:MM:SS ou HH:MM
  const parts = valor.split(':');
  if (parts.length === 3) {
    const horas = parseInt(parts[0]) || 0;
    const minutos = parseInt(parts[1]) || 0;
    const segundos = parseInt(parts[2]) || 0;
    return horas + minutos / 60 + segundos / 3600;
  }

  if (parts.length === 2) {
    const horas = parseInt(parts[0]) || 0;
    const minutos = parseInt(parts[1]) || 0;
    return horas + minutos / 60;
  }

  return 0;
}

export function formatarHorasParaHMS(horasDecimais: string | number): string {
  // Se já for string no formato HH:MM:SS, retornar como está
  if (typeof horasDecimais === 'string' && horasDecimais.includes(':')) {
    return horasDecimais;
  }

  const horas = typeof horasDecimais === 'string' ? parseFloat(horasDecimais) : horasDecimais;

  if (isNaN(horas) || horas === 0) return '00:00:00';

  const horasInteiras = Math.floor(horas);
  const minutosDecimais = (horas - horasInteiras) * 60;
  const minutosInteiros = Math.floor(minutosDecimais);
  const segundos = Math.round((minutosDecimais - minutosInteiros) * 60);

  return `${String(horasInteiras).padStart(2, '0')}:${String(minutosInteiros).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

// Formata horas grandes para exibição compacta (ex: 890.5k)
export function formatarHorasCompacta(horasDecimais: string | number): string {
  // Se já for string no formato HH:MM:SS, converter primeiro
  let horas: number;
  if (typeof horasDecimais === 'string' && horasDecimais.includes(':')) {
    const parts = horasDecimais.split(':');
    if (parts.length === 3) {
      const h = parseInt(parts[0]) || 0;
      const m = parseInt(parts[1]) || 0;
      const s = parseInt(parts[2]) || 0;
      horas = h + m / 60 + s / 3600;
    } else {
      horas = parseFloat(horasDecimais) || 0;
    }
  } else {
    horas = typeof horasDecimais === 'string' ? parseFloat(horasDecimais) : horasDecimais;
  }

  if (isNaN(horas) || horas === 0) return '0';

  // Se for muito grande, usar notação compacta
  if (horas >= 1000) {
    const milhares = horas / 1000;
    return `${milhares.toFixed(1)}k`;
  }

  return horas.toFixed(1);
}

export function getAderenciaColor(value: number): string {
  if (value >= 90) return 'text-emerald-600 dark:text-emerald-400';
  if (value >= 70) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

export function getAderenciaBgColor(value: number): string {
  if (value >= 90) return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800';
  if (value >= 70) return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
  return 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800';
}

// Retorna a cor hexadecimal para uso em style={{ backgroundColor: ... }}
// Verde para bom (>= 90), Vermelho para ruim (< 70), Azul para médio (70-90)
export function getAderenciaColorHex(value: number, isDark: boolean = false): string {
  if (value >= 90) return isDark ? '#10b981' : '#059669'; // emerald-400 : emerald-600 (VERDE - BOM)
  if (value >= 70) return isDark ? '#3b82f6' : '#2563eb'; // blue-500 : blue-600 (AZUL - MÉDIO)
  return isDark ? '#ef4444' : '#dc2626'; // red-500 : red-600 (VERMELHO - RUIM)
}