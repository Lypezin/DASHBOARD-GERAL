import { criarSlideComLayout } from '../helpers';
import { criarCardSubPraca } from './components/subPracaCard';

// Função para criar slide de sub-praças com design premium
export const criarSlideSubPracas = (
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
  }>,
  titulo: string = 'Sub-Praças'
): any => {
  const conteudo = {
    columns: itens.map((item) => criarCardSubPraca(item, numeroSemana1, numeroSemana2)),
    columnGap: 30,
    margin: [0, 15, 0, 0],
  };

  return criarSlideComLayout(
    conteudo,
    titulo,
    `Comparativo Semanas ${numeroSemana1} vs ${numeroSemana2}`,
    false,
    paginaAtual,
    totalPaginas
  );
};
