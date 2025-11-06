export function formatarHorasParaHMS(horasDecimais: string | number): string {
  const horas = typeof horasDecimais === 'string' ? parseFloat(horasDecimais) : horasDecimais;
  
  if (isNaN(horas) || horas === 0) return '00:00:00';
  
  const horasInteiras = Math.floor(horas);
  const minutosDecimais = (horas - horasInteiras) * 60;
  const minutosInteiros = Math.floor(minutosDecimais);
  const segundos = Math.round((minutosDecimais - minutosInteiros) * 60);
  
  return `${String(horasInteiras).padStart(2, '0')}:${String(minutosInteiros).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
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
