import {
    A4_LANDSCAPE_WIDTH,
    COR_PRIMARIA,
    COR_SUBTITULO,
    MARGEM_PADRAO,
    FONTE_TITULO,
} from '../constants';

export const criarHeader = (titulo: string, subtitulo?: string) => {
    return {
        stack: [
            {
                columns: [
                    {
                        text: titulo.toUpperCase(),
                        color: COR_PRIMARIA,
                        fontSize: FONTE_TITULO,
                        bold: true,
                        width: '*',
                        characterSpacing: 1,
                    },
                    subtitulo ? {
                        text: subtitulo,
                        color: COR_SUBTITULO,
                        fontSize: 13,
                        alignment: 'right',
                        margin: [0, 6, 0, 0],
                        width: 'auto',
                    } : {},
                ],
            },
            {
                canvas: [
                    {
                        type: 'line',
                        x1: 0,
                        y1: 0,
                        x2: A4_LANDSCAPE_WIDTH - (MARGEM_PADRAO * 2),
                        y2: 0,
                        lineWidth: 3,
                        lineColor: COR_PRIMARIA,
                    },
                ],
                margin: [0, 12, 0, 20],
            },
        ],
        margin: [MARGEM_PADRAO, MARGEM_PADRAO, MARGEM_PADRAO, 0],
    };
};
