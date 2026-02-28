
import {
    COR_TEXTO,
    COR_SUBTITULO,
    COR_VERDE,
    COR_VERMELHO,
    COR_PRIMARIA,
} from '../../constants';
import { criarGraficoCircular, obterSeta } from '../../helpers';
import { buildChartColumn } from './subPracaCardComponents';

export const buildTitleStack = (nome: string) => ({
    text: nome,
    fontSize: 20,
    bold: true,
    color: COR_TEXTO,
    alignment: 'center',
    margin: [0, 15, 0, 15] as [number, number, number, number],
    characterSpacing: 0.5,
});

export const buildPlannedBadge = (horasPlanejadas: string) => ({
    columns: [
        { width: '*', text: '' },
        {
            width: 'auto',
            stack: [
                {
                    text: 'PLANEJADO',
                    fontSize: 9,
                    color: COR_SUBTITULO,
                    alignment: 'center',
                    bold: true,
                    characterSpacing: 0.5,
                },
                {
                    text: horasPlanejadas,
                    fontSize: 16,
                    bold: true,
                    color: COR_PRIMARIA,
                    alignment: 'center',
                    margin: [0, 4, 0, 0] as [number, number, number, number],
                },
            ],
            fillColor: '#ffffff',
            borderRadius: 6,
            padding: [15, 8] as [number, number],
        },
        { width: '*', text: '' },
    ],
    margin: [0, 0, 0, 20] as [number, number, number, number],
});

export const buildChartsColumns = (
    semana1: { aderencia: number; horasEntregues: string },
    semana2: { aderencia: number; horasEntregues: string },
    numeroSemana1: string,
    numeroSemana2: string
) => {
    const graficoSize = 120;
    const grafico1 = criarGraficoCircular(semana1.aderencia, graficoSize, 12, COR_TEXTO, COR_PRIMARIA, '#e2e8f0');
    const grafico2 = criarGraficoCircular(semana2.aderencia, graficoSize, 12, COR_TEXTO, COR_PRIMARIA, '#e2e8f0');

    return {
        columns: [
            buildChartColumn(numeroSemana1, grafico1, semana1.horasEntregues, graficoSize),
            buildChartColumn(numeroSemana2, grafico2, semana2.horasEntregues, graficoSize),
        ],
        columnGap: 15,
        margin: [0, 0, 0, 20] as [number, number, number, number],
    };
};

export { buildVariationsColumns } from './subPracaCardVariations';
