
import { criarSlideComLayout } from '../helpers';
import { criarCardTurno } from './components/turnosCard';

// Função para criar slide de turnos - Design Premium
export const criarSlideTurnos = (
  numeroSemana1: string,
  numeroSemana2: string,
  paginaAtual: number,
  totalPaginas: number,
  itens: Array<{
    nome: string;
    semana1: { aderencia: number; horasEntregues: string };
    semana2: { aderencia: number; horasEntregues: string };
    variacoes: Array<{ label: string; valor: string; positivo: boolean }>;
  }>
): any => {

  const conteudo = {
    columns: itens.map((turno) => criarCardTurno(turno, numeroSemana1, numeroSemana2)),
    columnGap: 30,
    margin: [0, 15, 0, 0],
  };

  return criarSlideComLayout(
    conteudo,
    'Aderência por Turno',
    `Comparativo Semanas ${numeroSemana1} vs ${numeroSemana2}`,
    false,
    paginaAtual,
    totalPaginas
  );
};
