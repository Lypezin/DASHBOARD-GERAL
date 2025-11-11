
import {
  COR_AZUL_CLARO,
  COR_TEXTO,
  COR_VERDE,
  COR_VERMELHO,
} from '../constants';
import { adicionarBackgroundAoSlide } from '../utils';

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
    stack: [
      {
        text: 'DEMANDA E REJEIÇÕES',
        fontSize: 48,
        bold: true,
        color: COR_TEXTO,
        alignment: 'center',
        margin: [0, 18, 0, 10],
      },
      {
        text: `SEMANAS ${numeroSemana1} & ${numeroSemana2}`,
        fontSize: 26,
        color: '#e5e7eb',
        alignment: 'center',
        margin: [0, 0, 0, 22],
      },
      {
        columns: [
          // Coluna Semana 1
          {
            width: '*',
            stack: [
              {
                text: `SEMANA ${numeroSemana1}`,
                fontSize: 24,
                bold: true,
                color: COR_TEXTO,
                alignment: 'center',
                margin: [0, 0, 0, 15],
              },
              ...itens.map((item) => ({
                stack: [
                  {
                    text: item.label,
                    fontSize: 16,
                    bold: true,
                    color: '#e5e7eb',
                    alignment: 'center',
                    margin: [0, 0, 0, 5],
                  },
                  {
                    text: item.semana1Valor,
                    fontSize: 32,
                    bold: true,
                    color: COR_AZUL_CLARO,
                    alignment: 'center',
                  },
                ],
                fillColor: [255, 255, 255, 0.12],
                borderRadius: 10,
                padding: [12, 10],
                margin: [0, 0, 0, 10],
              })),
            ],
          },
          // Coluna Variações (Centro)
          {
            width: 'auto',
            stack: [
              {
                text: 'VARIAÇÕES',
                fontSize: 24,
                bold: true,
                color: COR_TEXTO,
                alignment: 'center',
                margin: [0, 0, 0, 15],
              },
              ...itens.map((item) => ({
                stack: [
                  {
                    text: item.label,
                    fontSize: 12,
                    color: '#d1d5db',
                    alignment: 'center',
                    margin: [0, 0, 0, 4],
                  },
                  {
                    text: item.variacaoValor,
                    fontSize: 24,
                    bold: true,
                    color: item.variacaoPositiva ? COR_VERDE : COR_VERMELHO,
                    alignment: 'center',
                    margin: [0, 0, 0, 3],
                  },
                  {
                    text: item.variacaoPercentual,
                    fontSize: 18,
                    bold: true,
                    color: item.variacaoPercentualPositiva ? COR_VERDE : COR_VERMELHO,
                    alignment: 'center',
                  },
                ],
                fillColor: [255, 255, 255, 0.10],
                borderRadius: 10,
                padding: [15, 10],
                margin: [0, 0, 0, 10],
              })),
            ],
          },
          // Coluna Semana 2
          {
            width: '*',
            stack: [
              {
                text: `SEMANA ${numeroSemana2}`,
                fontSize: 24,
                bold: true,
                color: COR_TEXTO,
                alignment: 'center',
                margin: [0, 0, 0, 15],
              },
              ...itens.map((item) => ({
                stack: [
                  {
                    text: item.label,
                    fontSize: 16,
                    bold: true,
                    color: '#e5e7eb',
                    alignment: 'center',
                    margin: [0, 0, 0, 5],
                  },
                  {
                    text: item.semana2Valor,
                    fontSize: 32,
                    bold: true,
                    color: COR_AZUL_CLARO,
                    alignment: 'center',
                  },
                ],
                fillColor: [255, 255, 255, 0.12],
                borderRadius: 10,
                padding: [12, 10],
                margin: [0, 0, 0, 10],
              })),
            ],
          },
        ],
        columnGap: 18,
        margin: [12, 0, 12, 0],
      },
    ],
  };
  
  return adicionarBackgroundAoSlide(conteudo);
};
