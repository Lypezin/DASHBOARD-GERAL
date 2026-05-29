import { Entregador } from '@/types';

export const calcularPercentualAceitas = (entregador: Entregador): number => {
  const ofertadas = entregador.corridas_ofertadas || 0;
  if (ofertadas === 0) return 0;
  return (entregador.corridas_aceitas / ofertadas) * 100;
};

export const calcularPercentualCompletadas = (entregador: Entregador): number => {
  const aceitas = entregador.corridas_aceitas || 0;
  if (aceitas === 0) return 0;
  return (entregador.corridas_completadas / aceitas) * 100;
};

export const getAderenciaColor = (aderencia: number) => {
  if (aderencia >= 90) return 'text-emerald-700 dark:text-emerald-400';
  if (aderencia >= 70) return 'text-amber-700 dark:text-amber-400';
  return 'text-rose-700 dark:text-rose-400';
};

export const getAderenciaBg = (aderencia: number) => {
  if (aderencia >= 90) return 'bg-emerald-50 dark:bg-emerald-950/30';
  if (aderencia >= 70) return 'bg-amber-50 dark:bg-amber-950/30';
  return 'bg-rose-50 dark:bg-rose-950/30';
};

export const getRejeicaoColor = (rejeicao: number) => {
  if (rejeicao <= 10) return 'text-emerald-700 dark:text-emerald-400';
  if (rejeicao <= 30) return 'text-amber-700 dark:text-amber-400';
  return 'text-rose-700 dark:text-rose-400';
};

export const getRejeicaoBg = (rejeicao: number) => {
  if (rejeicao <= 10) return 'bg-emerald-50 dark:bg-emerald-950/30';
  if (rejeicao <= 30) return 'bg-amber-50 dark:bg-amber-950/30';
  return 'bg-rose-50 dark:bg-rose-950/30';
};

export const getAceitasColor = (percentual: number) => {
  if (percentual >= 90) return 'text-emerald-700 dark:text-emerald-400';
  if (percentual >= 70) return 'text-amber-700 dark:text-amber-400';
  return 'text-rose-700 dark:text-rose-400';
};

export const getAceitasBg = (percentual: number) => {
  if (percentual >= 90) return 'bg-emerald-50 dark:bg-emerald-950/30';
  if (percentual >= 70) return 'bg-amber-50 dark:bg-amber-950/30';
  return 'bg-rose-50 dark:bg-rose-950/30';
};

export const getCompletadasColor = (percentual: number) => {
  if (percentual >= 95) return 'text-emerald-700 dark:text-emerald-400';
  if (percentual >= 80) return 'text-amber-700 dark:text-amber-400';
  return 'text-rose-700 dark:text-rose-400';
};

export const getCompletadasBg = (percentual: number) => {
  if (percentual >= 95) return 'bg-emerald-50 dark:bg-emerald-950/30';
  if (percentual >= 80) return 'bg-amber-50 dark:bg-amber-950/30';
  return 'bg-rose-50 dark:bg-rose-950/30';
};

