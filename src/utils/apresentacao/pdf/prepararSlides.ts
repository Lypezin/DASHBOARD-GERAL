import {
    criarSlideCapa,
    criarSlideAderenciaGeral,
    criarSlideAderenciaDiaria,
    criarSlideTurnos,
    criarSlideSubPracas,
    criarSlideDemandaRejeicoes,
    criarSlideOrigens,
} from '@/components/apresentacao/pdf';
import { chunkArray } from '../printHelpers';
import { DadosProcessados } from '../dataProcessor';

const SUB_PRACAS_PER_PAGE = 2;
const TURNOS_PER_PAGE = 2;
const ORIGENS_PER_PAGE = 2;

export const prepararSlidesPDF = (
    dadosProcessados: DadosProcessados,
    numeroSemana1: string,
    numeroSemana2: string,
    periodoSemana1: string,
    periodoSemana2: string,
    pracaSelecionada: string | null
): any[] => {
    const pdfSlides: any[] = [];
    const { resumoSemana1, resumoSemana2, variacaoResumo, subPracasComparativo, semana1Dias, semana2Dias, turnosComparativo, origensComparativo, demandaItens } = dadosProcessados;

    pdfSlides.push(
        criarSlideCapa(pracaSelecionada, numeroSemana1, numeroSemana2, periodoSemana1, periodoSemana2)
    );

    pdfSlides.push(criarSlideAderenciaGeral(resumoSemana1, resumoSemana2, variacaoResumo));

    const subPracasPaginas = chunkArray(subPracasComparativo, SUB_PRACAS_PER_PAGE);
    subPracasPaginas.forEach((pagina, indice) => {
        pdfSlides.push(
            criarSlideSubPracas(
                numeroSemana1,
                numeroSemana2,
                indice + 1,
                subPracasPaginas.length,
                pagina
            )
        );
    });

    pdfSlides.push(criarSlideAderenciaDiaria(numeroSemana1, numeroSemana2, semana1Dias, semana2Dias));

    const turnosPaginas = chunkArray(turnosComparativo, TURNOS_PER_PAGE);
    turnosPaginas.forEach((pagina, indice) => {
        pdfSlides.push(
            criarSlideTurnos(
                numeroSemana1,
                numeroSemana2,
                indice + 1,
                turnosPaginas.length,
                pagina
            )
        );
    });

    const origensPaginas = chunkArray(origensComparativo, ORIGENS_PER_PAGE);
    origensPaginas.forEach((pagina, indice) => {
        pdfSlides.push(
            criarSlideOrigens(
                numeroSemana1,
                numeroSemana2,
                indice + 1,
                origensPaginas.length,
                pagina
            )
        );
    });

    pdfSlides.push(criarSlideDemandaRejeicoes(numeroSemana1, numeroSemana2, demandaItens));

    return pdfSlides;
};
