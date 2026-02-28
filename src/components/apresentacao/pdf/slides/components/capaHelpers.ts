
import {
    COR_TEXTO_CLARO,
    COR_PRIMARIA_CLARA,
    A4_LANDSCAPE_HEIGHT
} from '../../constants';

export const buildTopDecoration = () => ({
    canvas: [{ type: 'line', x1: 340, y1: 0, x2: 500, y2: 0, lineWidth: 3, lineColor: COR_PRIMARIA_CLARA }],
    margin: [0, 0, 0, 30] as [number, number, number, number],
});

export const buildMainTitle = () => ({
    text: 'RELATÓRIO DE RESULTADOS',
    fontSize: 52,
    bold: true,
    color: COR_TEXTO_CLARO,
    alignment: 'center',
    margin: [0, 0, 0, 20] as [number, number, number, number],
    characterSpacing: 4,
});

export const buildDivider = () => ({
    canvas: [{ type: 'line', x1: 340, y1: 0, x2: 500, y2: 0, lineWidth: 3, lineColor: COR_PRIMARIA_CLARA }],
    margin: [0, 0, 0, 40] as [number, number, number, number],
});

export const buildPracaText = (praca: string | null) => ({
    text: (praca || 'TODAS AS PRAÇAS').toUpperCase(),
    fontSize: 36,
    color: COR_TEXTO_CLARO,
    alignment: 'center',
    margin: [0, 0, 0, 50] as [number, number, number, number],
    characterSpacing: 2,
    opacity: 0.95,
});

export const buildWeeksContainer = (numeroSemana1: string, numeroSemana2: string, periodoSemana1: string, periodoSemana2: string) => ({
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
                    margin: [0, 0, 0, 12] as [number, number, number, number],
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
                    margin: [0, 0, 0, 12] as [number, number, number, number],
                },
                {
                    text: `${periodoSemana1} | ${periodoSemana2}`,
                    fontSize: 18,
                    color: '#93c5fd', // Blue 300
                    alignment: 'center',
                },
            ],
        },
        { width: '*', text: '' },
    ],
});

export const buildFooterDate = () => ({
    text: new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' }).toUpperCase(),
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    alignment: 'center',
    absolutePosition: { x: 0, y: A4_LANDSCAPE_HEIGHT - 60 },
    characterSpacing: 2,
});
