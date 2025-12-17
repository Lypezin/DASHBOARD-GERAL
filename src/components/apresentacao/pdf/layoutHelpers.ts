import {
    A4_LANDSCAPE_HEIGHT,
    A4_LANDSCAPE_WIDTH,
    COR_PRIMARIA,
    COR_BACKGROUND,
    COR_BACKGROUND_CAPA,
    COR_SUBTITULO,
    MARGEM_PADRAO,
    FONTE_TITULO,
} from './constants';

export const criarRetanguloFundo = (isCapa: boolean = false) => ({
    canvas: [
        {
            type: 'rect',
            x: 0,
            y: 0,
            w: A4_LANDSCAPE_WIDTH,
            h: A4_LANDSCAPE_HEIGHT,
            color: isCapa ? COR_BACKGROUND_CAPA : COR_BACKGROUND,
        },
    ],
    absolutePosition: { x: 0, y: 0 },
});

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

export const criarFooter = (numeroPagina?: number, totalPaginas?: number) => {
    const dataAtual = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    return {
        stack: [
            {
                canvas: [
                    {
                        type: 'line',
                        x1: 0,
                        y1: 0,
                        x2: A4_LANDSCAPE_WIDTH - (MARGEM_PADRAO * 2),
                        y2: 0,
                        lineWidth: 1,
                        lineColor: '#e2e8f0',
                    },
                ],
                margin: [0, 0, 0, 12],
            },
            {
                columns: [
                    {
                        text: 'Relatório Gerado Automaticamente',
                        color: '#94a3b8',
                        fontSize: 9,
                        width: '*',
                        italics: true,
                    },
                    {
                        text: dataAtual,
                        color: '#64748b',
                        fontSize: 9,
                        width: 'auto',
                        alignment: 'center',
                        bold: true,
                    },
                    {
                        text: numeroPagina && totalPaginas ? `Página ${numeroPagina} de ${totalPaginas}` : '',
                        color: '#64748b',
                        fontSize: 9,
                        width: '*',
                        alignment: 'right',
                    },
                ],
            },
        ],
        absolutePosition: { x: MARGEM_PADRAO, y: A4_LANDSCAPE_HEIGHT - 45 },
    };
};

// Wrapper principal para slides
export const criarSlideComLayout = (
    conteudo: any,
    titulo?: string,
    subtitulo?: string,
    isCapa: boolean = false,
    numeroPagina?: number,
    totalPaginas?: number
) => {
    if (isCapa) {
        return {
            stack: [
                criarRetanguloFundo(true),
                conteudo,
            ],
        };
    }

    return {
        stack: [
            criarRetanguloFundo(false),
            titulo ? criarHeader(titulo, subtitulo) : {},
            {
                stack: [conteudo],
                margin: [MARGEM_PADRAO, 0, MARGEM_PADRAO, 0],
            },
            criarFooter(numeroPagina, totalPaginas),
        ],
    };
};

export const adicionarBackgroundAoSlide = (conteudo: any) => {
    return criarSlideComLayout(conteudo, undefined, undefined, true);
};
