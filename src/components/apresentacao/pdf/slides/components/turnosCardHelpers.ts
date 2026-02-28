
import {
    COR_TEXTO,
    COR_SUBTITULO,
    COR_VERDE,
    COR_VERMELHO,
    COR_PRIMARIA,
} from '../../constants';
import { criarGraficoCircular, obterSeta } from '../../helpers';

export const buildTurnoTitle = (nome: string) => ({
    text: nome, fontSize: 22, bold: true, color: COR_TEXTO, alignment: 'center',
    margin: [0, 15, 0, 20] as [number, number, number, number], characterSpacing: 0.5,
});

export const buildChartsColumns = (
    semana1: { aderencia: number; horasEntregues: string },
    semana2: { aderencia: number; horasEntregues: string },
    numeroSemana1: string,
    numeroSemana2: string
) => {
    const graficoSize = 120;
    const grafico1 = criarGraficoCircular(semana1.aderencia, graficoSize, 14, COR_TEXTO, COR_PRIMARIA, '#e2e8f0');
    const grafico2 = criarGraficoCircular(semana2.aderencia, graficoSize, 14, COR_TEXTO, COR_PRIMARIA, '#e2e8f0');

    const buildColumn = (numeroSemana: string, grafico: string, horasEntregues: string) => ({
        width: '*',
        stack: [
            {
                text: `SEMANA ${numeroSemana}`,
                fontSize: 12,
                bold: true,
                color: COR_SUBTITULO,
                alignment: 'center',
                characterSpacing: 0.5,
                margin: [0, 0, 0, 12] as [number, number, number, number],
            },
            { svg: grafico, width: graficoSize, alignment: 'center', margin: [0, 0, 0, 12] as [number, number, number, number] },
            {
                text: 'ENTREGUE',
                fontSize: 9,
                color: COR_SUBTITULO,
                alignment: 'center',
                bold: true,
                margin: [0, 0, 0, 4] as [number, number, number, number],
            },
            {
                text: horasEntregues,
                fontSize: 16,
                bold: true,
                color: COR_VERDE,
                alignment: 'center',
            },
        ],
    });

    return {
        columns: [
            buildColumn(numeroSemana1, grafico1, semana1.horasEntregues),
            buildColumn(numeroSemana2, grafico2, semana2.horasEntregues),
        ],
        columnGap: 20,
        margin: [0, 0, 0, 20] as [number, number, number, number],
    };
};

export const buildVariationsColumns = (variacoes: Array<{ label: string; valor: string; positivo: boolean }>) => ({
    columns: variacoes.map((variacao) => ({
        width: '*',
        stack: [
            {
                text: variacao.label.toUpperCase(),
                fontSize: 9,
                color: COR_SUBTITULO,
                alignment: 'center',
                bold: true,
                characterSpacing: 0.3,
                margin: [0, 0, 0, 5] as [number, number, number, number],
            },
            {
                text: `${obterSeta(variacao.positivo)} ${variacao.valor}`,
                fontSize: 14,
                bold: true,
                color: variacao.positivo ? COR_VERDE : COR_VERMELHO,
                alignment: 'center',
                margin: [0, 0, 0, 2] as [number, number, number, number],
            },
        ],
        fillColor: variacao.positivo ? '#ecfdf5' : '#fef2f2',
        borderRadius: 8,
        padding: [10, 8] as [number, number],
        margin: [4, 0] as [number, number],
    })),
    columnGap: 12,
});
