
import { COR_SUBTITULO, COR_VERDE } from '../../constants';

export const buildChartColumn = (numeroSemana: string, grafico: string, horasEntregues: string, graficoSize: number) => ({
    width: '*',
    stack: [
        {
            text: `SEMANA ${numeroSemana}`,
            fontSize: 11,
            bold: true,
            color: COR_SUBTITULO,
            alignment: 'center',
            characterSpacing: 0.5,
            margin: [0, 0, 0, 10] as [number, number, number, number],
        },
        {
            svg: grafico,
            width: graficoSize,
            alignment: 'center',
            margin: [0, 0, 0, 10] as [number, number, number, number],
        },
        {
            text: 'ENTREGUE',
            fontSize: 9,
            color: COR_SUBTITULO,
            alignment: 'center',
            margin: [0, 0, 0, 4] as [number, number, number, number],
        },
        {
            text: horasEntregues,
            fontSize: 15,
            bold: true,
            color: COR_VERDE,
            alignment: 'center',
        },
    ],
});
