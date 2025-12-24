
import React from 'react';
import SlideCapa from '@/components/apresentacao/slides/SlideCapa';
import SlideAderenciaGeral from '@/components/apresentacao/slides/SlideAderenciaGeral';
import SlideSubPracas from '@/components/apresentacao/slides/SlideSubPracas';
import SlideAderenciaDiaria from '@/components/apresentacao/slides/SlideAderenciaDiaria';
import SlideTurnos from '@/components/apresentacao/slides/SlideTurnos';
import SlideOrigem from '@/components/apresentacao/slides/SlideOrigem';

interface ReportSlidesProps {
    praca?: string | null;
    numeroSemana1: number | string;
    numeroSemana2: number | string;
    processedData: any; // Type this properly if possible, but 'any' matches previous usage
}

export const ReportSlides: React.FC<ReportSlidesProps> = ({
    praca,
    numeroSemana1,
    numeroSemana2,
    processedData
}) => {
    return (
        <>
            <div className="page">
                <SlideCapa
                    isVisible
                    pracaSelecionada={praca || null}
                    numeroSemana1={String(numeroSemana1)}
                    numeroSemana2={String(numeroSemana2)}
                    periodoSemana1={''}
                    periodoSemana2={''}
                />
            </div>

            <div className="page">
                <SlideAderenciaGeral
                    isVisible
                    semana1={processedData.resumoSemana1}
                    semana2={processedData.resumoSemana2}
                    variacao={processedData.variacaoResumo}
                />
            </div>

            <div className="page">
                <SlideAderenciaDiaria
                    isVisible
                    numeroSemana1={String(numeroSemana1)}
                    numeroSemana2={String(numeroSemana2)}
                    semana1Dias={processedData.semana1Dias}
                    semana2Dias={processedData.semana2Dias}
                />
            </div>

            {processedData.turnosPaginas.map((pagina: any, idx: number) => (
                <div className="page" key={`turnos-${idx}`}>
                    <SlideTurnos
                        isVisible
                        numeroSemana1={String(numeroSemana1)}
                        numeroSemana2={String(numeroSemana2)}
                        paginaAtual={idx + 1}
                        totalPaginas={processedData.turnosPaginas.length}
                        itens={pagina}
                    />
                </div>
            ))}

            {processedData.subPracasPaginas.map((pagina: any, idx: number) => (
                <div className="page" key={`subpracas-${idx}`}>
                    <SlideSubPracas
                        isVisible
                        numeroSemana1={String(numeroSemana1)}
                        numeroSemana2={String(numeroSemana2)}
                        paginaAtual={idx + 1}
                        totalPaginas={processedData.subPracasPaginas.length}
                        itens={pagina}
                    />
                </div>
            ))}

            {processedData.origensPaginas.map((pagina: any, idx: number) => (
                <div className="page" key={`origens-${idx}`}>
                    <SlideOrigem
                        isVisible
                        numeroSemana1={String(numeroSemana1)}
                        numeroSemana2={String(numeroSemana2)}
                        paginaAtual={idx + 1}
                        totalPaginas={processedData.origensPaginas.length}
                        itens={pagina}
                    />
                </div>
            ))}
        </>
    );
};
