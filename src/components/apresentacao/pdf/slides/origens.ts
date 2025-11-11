
import { criarSlideSubPracas } from './subPracas';

// Função para criar slide de origens (similar a sub-praças)
export const criarSlideOrigens = (
  numeroSemana1: string,
  numeroSemana2: string,
  paginaAtual: number,
  totalPaginas: number,
  itens: Array<{
    nome: string;
    horasPlanejadas: string;
    semana1: { aderencia: number; horasEntregues: string };
    semana2: { aderencia: number; horasEntregues: string };
    variacoes: Array<{ label: string; valor: string; positivo: boolean }>;
  }>
): any => {
  // Reutilizar a mesma estrutura de sub-praças
  return criarSlideSubPracas(numeroSemana1, numeroSemana2, paginaAtual, totalPaginas, itens);
};
