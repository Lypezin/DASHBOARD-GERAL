
import { COR_PRIMARIA } from '../constants';
import { criarSlideComLayout } from '../helpers';
import { criarCardMetricaDemanda, criarCardVariacaoDemanda } from './components/demandaRejeicoesHelpers';

// Função para criar slide de demanda/rejeições - Design Premium
export const criarSlideDemandaRejeicoes = (
  numeroSemana1: string,
  numeroSemana2: string,
  itens: Array<{
    label: string;
    icone: string;
    semana1Valor: string;
    semana2Valor: string;
    variacaoValor: string;
    variacaoPositiva: boolean;
    variacaoPercentual: string;
    variacaoPercentualPositiva: boolean;
  }>
): any => {

  const conteudo = {
    columns: [
      // Coluna Semana 1
      {
        width: '*',
        stack: [
          {
            text: `SEMANA ${numeroSemana1}`,
            fontSize: 18,
            bold: true,
            color: COR_PRIMARIA,
            alignment: 'center',
            characterSpacing: 0.5,
            margin: [0, 10, 0, 20],
          },
          ...itens.map((item) => criarCardMetricaDemanda(item, true)),
        ],
      },
      // Coluna Variações (Centro)
      {
        width: 200,
        stack: [
          {
            text: 'VARIAÇÕES',
            fontSize: 18,
            bold: true,
            color: COR_PRIMARIA,
            alignment: 'center',
            characterSpacing: 0.5,
            margin: [0, 10, 0, 20],
          },
          ...itens.map((item) => criarCardVariacaoDemanda(item)),
        ],
      },
      // Coluna Semana 2
      {
        width: '*',
        stack: [
          {
            text: `SEMANA ${numeroSemana2}`,
            fontSize: 18,
            bold: true,
            color: COR_PRIMARIA,
            alignment: 'center',
            characterSpacing: 0.5,
            margin: [0, 10, 0, 20],
          },
          ...itens.map((item) => criarCardMetricaDemanda(item, false)),
        ],
      },
    ],
    columnGap: 25,
    margin: [0, 10, 0, 0],
  };

  return criarSlideComLayout(
    conteudo,
    'Demanda e Rejeições',
    `Comparativo Semanas ${numeroSemana1} vs ${numeroSemana2}`
  );
};
