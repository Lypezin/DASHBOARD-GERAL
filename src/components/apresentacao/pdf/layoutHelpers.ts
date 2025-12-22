import { MARGEM_PADRAO } from './constants';
import { criarHeader } from './components/createPdfHeader';
import { criarFooter } from './components/createPdfFooter';
import { criarRetanguloFundo } from './components/createPdfBackground';

// Re-export for compatibility
export { criarHeader, criarFooter, criarRetanguloFundo };

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
