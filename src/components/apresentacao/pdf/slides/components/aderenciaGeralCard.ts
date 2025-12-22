import {
    COR_TEXTO,
    COR_SUBTITULO,
    COR_VERDE,
    COR_CINZA_CLARO,
    FONTE_TITULO,
    BORDA_RAIO_GRANDE,
} from '../../constants';

// Card estilizado para cada semana
export const criarCardSemana = (
    semana: { numeroSemana: string; aderencia: number; horasPlanejadas: string; horasEntregues: string },
    grafico: string,
    graficoSize: number,
    isSecondWeek: boolean = false
) => ({
    width: '*',
    stack: [
        // Header do card
        {
            text: `SEMANA ${semana.numeroSemana}`,
            fontSize: FONTE_TITULO,
            bold: true,
            color: COR_TEXTO,
            alignment: 'center',
            margin: [0, 20, 0, 25],
            characterSpacing: 1,
        },
        // Gráfico centralizado
        {
            svg: grafico,
            width: graficoSize,
            alignment: 'center',
            margin: [0, 0, 0, 25],
        },
        // Métricas em layout elegante
        {
            columns: [
                {
                    width: '*',
                    stack: [
                        {
                            text: 'PLANEJADO',
                            color: COR_SUBTITULO,
                            fontSize: 10,
                            alignment: 'center',
                            bold: true,
                            characterSpacing: 0.5,
                            margin: [0, 0, 0, 6],
                        },
                        {
                            text: semana.horasPlanejadas,
                            color: COR_TEXTO,
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                        },
                    ],
                },
                {
                    width: '*',
                    stack: [
                        {
                            text: 'ENTREGUE',
                            color: COR_SUBTITULO,
                            fontSize: 10,
                            alignment: 'center',
                            bold: true,
                            characterSpacing: 0.5,
                            margin: [0, 0, 0, 6],
                        },
                        {
                            text: semana.horasEntregues,
                            color: COR_VERDE,
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                        },
                    ],
                },
            ],
            margin: [15, 0, 15, 20],
        },
    ],
    fillColor: COR_CINZA_CLARO,
    borderRadius: BORDA_RAIO_GRANDE,
});
