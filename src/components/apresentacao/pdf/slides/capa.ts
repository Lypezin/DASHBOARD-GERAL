
import { COR_TEXTO_CLARO, COR_PRIMARIA_CLARA, FONTE_TITULO_GRANDE, A4_LANDSCAPE_HEIGHT } from '../constants';
import { criarSlideComLayout } from '../helpers';

// Função para criar slide de capa - Design Premium
export const criarSlideCapa = (
  praca: string | null,
  numeroSemana1: string,
  numeroSemana2: string,
  periodoSemana1: string,
  periodoSemana2: string
): any => {
  const conteudo = {
    stack: [
      // Espaçamento superior aumentado para melhor centralização
      { text: '', margin: [0, 80, 0, 0] },

      // Ícone ou decoração superior
      {
        canvas: [
          {
            type: 'line',
            x1: 340,
            y1: 0,
            x2: 500,
            y2: 0,
            lineWidth: 3,
            lineColor: COR_PRIMARIA_CLARA,
          },
        ],
        margin: [0, 0, 0, 30],
      },

      // Título principal com estilo premium
      {
        text: 'RELATÓRIO DE RESULTADOS',
        fontSize: 52,
        bold: true,
        color: COR_TEXTO_CLARO,
        alignment: 'center',
        margin: [0, 0, 0, 20],
        characterSpacing: 4,
      },

      // Linha decorativa
      {
        canvas: [
          {
            type: 'line',
            x1: 340,
            y1: 0,
            x2: 500,
            y2: 0,
            lineWidth: 3,
            lineColor: COR_PRIMARIA_CLARA,
          },
        ],
        margin: [0, 0, 0, 40],
      },

      // Praça/Cidade com destaque
      {
        text: (praca || 'TODAS AS PRAÇAS').toUpperCase(),
        fontSize: 36,
        color: COR_TEXTO_CLARO,
        alignment: 'center',
        margin: [0, 0, 0, 50],
        characterSpacing: 2,
        opacity: 0.95,
      },

      // Container para semanas
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            stack: [
              {
                text: `SEMANAS ${numeroSemana1} & ${numeroSemana2}`,
                fontSize: 28,
                color: COR_TEXTO_CLARO,
                alignment: 'center',
                margin: [0, 0, 0, 12],
                bold: true,
                characterSpacing: 1,
              },
              {
                canvas: [
                  {
                    type: 'rect',
                    x: 0,
                    y: 0,
                    w: 280,
                    h: 1,
                    color: 'rgba(255,255,255,0.3)',
                  },
                ],
                margin: [0, 0, 0, 12],
              },
              {
                text: `${periodoSemana1} | ${periodoSemana2}`,
                fontSize: 18,
                color: '#93c5fd', // Blue 300 - legível mas suave
                alignment: 'center',
              },
            ],
          },
          { width: '*', text: '' },
        ],
      },

      // Rodapé da capa
      {
        text: new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' }).toUpperCase(),
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        alignment: 'center',
        absolutePosition: { x: 0, y: A4_LANDSCAPE_HEIGHT - 60 },
        characterSpacing: 2,
      },
    ],
  };

  return criarSlideComLayout(conteudo, undefined, undefined, true);
};
