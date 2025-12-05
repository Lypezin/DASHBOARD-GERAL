
import {
  COR_TEXTO,
  COR_VERDE,
  COR_VERMELHO,
  COR_PRIMARIA,
  COR_CINZA_CLARO,
  COR_SUBTITULO,
  BORDA_RAIO_GRANDE,
} from '../constants';
import { criarSlideComLayout, criarSetaParaCima, criarSetaParaBaixo } from '../helpers';

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
  const criarCardMetrica = (item: typeof itens[0], isSemana1: boolean) => ({
    stack: [
      {
        text: item.label.toUpperCase(),
        fontSize: 11,
        bold: true,
        color: COR_SUBTITULO,
        alignment: 'center',
        characterSpacing: 0.5,
        margin: [0, 0, 0, 8],
      },
      {
        text: isSemana1 ? item.semana1Valor : item.semana2Valor,
        fontSize: 28,
        bold: true,
        color: COR_TEXTO,
        alignment: 'center',
      },
    ],
    fillColor: COR_CINZA_CLARO,
    borderRadius: 12,
    padding: [15, 12],
    margin: [0, 0, 0, 12],
  });

  const criarCardVariacao = (item: typeof itens[0]) => ({
    stack: [
      {
        text: item.label.toUpperCase(),
        fontSize: 10,
        color: COR_SUBTITULO,
        alignment: 'center',
        bold: true,
        characterSpacing: 0.5,
        margin: [0, 0, 0, 6],
      },
      // Valor com seta
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            svg: item.variacaoPositiva
              ? criarSetaParaCima(16, COR_VERDE)
              : criarSetaParaBaixo(16, COR_VERMELHO),
            margin: [0, 0, 4, 0],
          },
          {
            width: 'auto',
            text: item.variacaoValor,
            fontSize: 22,
            bold: true,
            color: item.variacaoPositiva ? COR_VERDE : COR_VERMELHO,
          },
          { width: '*', text: '' },
        ],
        margin: [0, 0, 0, 4],
      },
      // Percentual com seta
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            svg: item.variacaoPercentualPositiva
              ? criarSetaParaCima(12, COR_VERDE)
              : criarSetaParaBaixo(12, COR_VERMELHO),
            margin: [0, 0, 3, 0],
          },
          {
            width: 'auto',
            text: item.variacaoPercentual,
            fontSize: 16,
            bold: true,
            color: item.variacaoPercentualPositiva ? COR_VERDE : COR_VERMELHO,
          },
          { width: '*', text: '' },
        ],
      },
    ],
    fillColor: item.variacaoPositiva ? '#ecfdf5' : '#fef2f2',
    borderRadius: 10,
    padding: [15, 12],
    margin: [0, 0, 0, 12],
  });

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
          ...itens.map((item) => criarCardMetrica(item, true)),
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
          ...itens.map((item) => criarCardVariacao(item)),
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
          ...itens.map((item) => criarCardMetrica(item, false)),
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
