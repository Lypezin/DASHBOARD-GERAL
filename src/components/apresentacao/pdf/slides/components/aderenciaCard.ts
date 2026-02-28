
import { COR_TEXTO, COR_PRIMARIA, COR_CINZA_CLARO, COR_SUBTITULO, COR_VERDE, BORDA_RAIO_MEDIO } from '../../constants';
import { criarGraficoCircular } from '../../helpers';
import { criarStackDiferencasAderencia } from './aderenciaCardHelpers';

export const criarCardDia = (
    dia: { sigla: string; aderencia: number; horasEntregues: string },
    temDiferencas: boolean = false,
    diferencas?: {
        diferencaHoras: string;
        diferencaHorasPositiva: boolean;
        diferencaPercentualHoras: string;
        diferencaPercentualHorasPositiva: boolean;
        diferencaAderencia: string;
        diferencaAderenciaPositiva: boolean;
    }
) => {
    // Gráfico para cards diários - otimizado
    const grafico = criarGraficoCircular(dia.aderencia, 65, 6, COR_TEXTO, COR_PRIMARIA, '#e2e8f0');

    return {
        width: '*',
        stack: [
            // Nome do dia
            {
                text: dia.sigla,
                fontSize: 13,
                bold: true,
                color: COR_TEXTO,
                alignment: 'center',
                margin: [0, 8, 0, 8],
                characterSpacing: 0.5,
            },
            // Gráfico circular
            {
                svg: grafico,
                width: 65,
                alignment: 'center',
                margin: [0, 0, 0, 8],
            },
            // Horas entregues
            {
                stack: [
                    { text: 'ENTREGUE', fontSize: 8, color: COR_SUBTITULO, alignment: 'center', bold: true, characterSpacing: 0.3, margin: [0, 0, 0, 3] },
                    { text: dia.horasEntregues, fontSize: 11, bold: true, color: COR_VERDE, alignment: 'center' },
                ],
                fillColor: '#ffffff', borderRadius: 6, padding: [6, 5], margin: [4, 0, 4, 4],
            },
            // Diferenças (se existirem) com setas Unicode
            ...(temDiferencas && diferencas
                ? [criarStackDiferencasAderencia(diferencas)]
                : [{ text: '', margin: [0, 0, 0, 6] }]),
        ],
        fillColor: COR_CINZA_CLARO,
        borderRadius: BORDA_RAIO_MEDIO,
        margin: [3, 0],
    };
};

export const criarCabecalhoSemana = (numeroSemana: string) => {
    return {
        columns: [
            {
                width: 'auto',
                text: `SEMANA ${numeroSemana}`,
                fontSize: 14,
                bold: true,
                color: COR_PRIMARIA,
                characterSpacing: 0.5,
                margin: [0, 5, 0, 0],
            },
            {
                width: '*',
                canvas: [
                    {
                        type: 'line',
                        x1: 10,
                        y1: 10,
                        x2: 700,
                        y2: 10,
                        lineWidth: 1,
                        lineColor: '#e2e8f0',
                    },
                ],
            },
        ],
        margin: [0, 0, 0, 12],
    };
}
