
import {
  COR_AZUL_CLARO,
  COR_TEXTO,
  COR_VERDE,
  COR_VERMELHO,
  COR_PRIMARIA,
  COR_CINZA_CLARO,
  COR_SUBTITULO,
  COR_BORDA,
} from '../constants';
import { criarSlideComLayout } from '../helpers';

// Função para criar slide de demanda/rejeições
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
  // Layout com 3 colunas: Semana 1 | Variações | Semana 2

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
            margin: [0, 0, 0, 15],
          },
          ...itens.map((item) => ({
            stack: [
              {
                text: item.label,
                fontSize: 14,
                bold: true,
                color: COR_SUBTITULO,
                alignment: 'center',
                margin: [0, 0, 0, 5],
              },
              {
                text: item.semana1Valor,
                fontSize: 24,
                bold: true,
                color: COR_TEXTO,
                alignment: 'center',
              },
            ],
            fillColor: COR_CINZA_CLARO,
            borderRadius: 8,
            padding: [12, 10],
            margin: [0, 0, 0, 10],
            border: [true, true, true, true],
            borderColor: [COR_BORDA, COR_BORDA, COR_BORDA, COR_BORDA],
          })),
        ],
      },
      // Coluna Variações (Centro)
      {
        width: 'auto',
        stack: [
          {
            text: 'VARIAÇÕES',
            fontSize: 18,
            bold: true,
            color: COR_PRIMARIA,
            alignment: 'center',
            margin: [0, 0, 0, 15],
          },
          ...itens.map((item) => ({
            stack: [
              {
                text: item.label,
                fontSize: 12,
                color: COR_SUBTITULO,
                alignment: 'center',
                margin: [0, 0, 0, 4],
              },
              {
                text: item.variacaoValor,
                fontSize: 20,
                bold: true,
                color: item.variacaoPositiva ? COR_VERDE : COR_VERMELHO,
                alignment: 'center',
                margin: [0, 0, 0, 3],
              },
              {
                text: item.variacaoPercentual,
                fontSize: 16,
                bold: true,
                color: item.variacaoPercentualPositiva ? COR_VERDE : COR_VERMELHO,
                alignment: 'center',
              },
            ],
            fillColor: '#ffffff',
            borderRadius: 8,
            padding: [12, 10],
            margin: [0, 0, 0, 10],
            border: [true, true, true, true],
            borderColor: [COR_BORDA, COR_BORDA, COR_BORDA, COR_BORDA],
          })),
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
            margin: [0, 0, 0, 15],
          },
          ...itens.map((item) => ({
            stack: [
              {
                text: item.label,
                fontSize: 14,
                bold: true,
                color: COR_SUBTITULO,
                alignment: 'center',
                margin: [0, 0, 0, 5],
              },
              {
                text: item.semana2Valor,
                fontSize: 24,
                bold: true,
                color: COR_TEXTO,
                alignment: 'center',
              },
            ],
            fillColor: COR_CINZA_CLARO,
            borderRadius: 8,
            padding: [12, 10],
            margin: [0, 0, 0, 10],
            border: [true, true, true, true],
            borderColor: [COR_BORDA, COR_BORDA, COR_BORDA, COR_BORDA],
          })),
        ],
      },
    ],
    columnGap: 18,
    margin: [0, 20, 0, 0],
  };

  return criarSlideComLayout(
    conteudo,
    'Demanda e Rejeições',
    `Comparativo Semanas ${numeroSemana1} vs ${numeroSemana2}`
  );
};
