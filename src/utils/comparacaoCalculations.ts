/**
 * Funções utilitárias para cálculos de comparação entre semanas
 */

export const calcularVariacao = (
  valor1: number | null | undefined,
  valor2: number | null | undefined
): string => {
  const v1 = valor1 ?? 0;
  const v2 = valor2 ?? 0;
  if (v1 === 0) return '0.0';
  const variacao = ((v2 - v1) / v1) * 100;
  return variacao.toFixed(1);
};

export const calcularVariacaoPercentual = (
  valor1: number | null | undefined,
  valor2: number | null | undefined
): number => {
  const v1 = valor1 ?? 0;
  const v2 = valor2 ?? 0;
  if (v1 === 0) return 0;
  return ((v2 - v1) / v1) * 100;
};

