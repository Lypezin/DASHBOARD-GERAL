import {
    A4_LANDSCAPE_HEIGHT,
    A4_LANDSCAPE_WIDTH,
    MARGEM_PADRAO,
} from '../constants';

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
