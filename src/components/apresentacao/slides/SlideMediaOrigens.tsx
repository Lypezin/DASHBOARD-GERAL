import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { SlideHeader } from './components/SlideHeader';
import { WeekComparisonCircle } from './components/WeekComparisonCircle';
import { VariacaoAderenciaBox } from './components/VariacaoAderenciaBox';
import { OrigemProcessada } from '@/utils/apresentacao/processors/origens';

interface SlideMediaOrigensProps {
    isVisible: boolean;
    numeroSemana1: string;
    numeroSemana2: string;
    media: OrigemProcessada;
}

const SlideMediaOrigens: React.FC<SlideMediaOrigensProps> = ({
    isVisible,
    numeroSemana1,
    numeroSemana2,
    media,
}) => {
    if (!media) return null;

    // Usa apenas a primeira variação de aderência se houver
    const variacaoAderencia = media.variacoes.find(v => v.label.includes('Aderência')) || media.variacoes[0];

    return (
        <SlideWrapper
            isVisible={isVisible}
            className="flex flex-col items-center justify-center"
            style={{ padding: '32px 48px' }}
        >
            <header className="text-center mb-10 w-full flex-shrink-0">
                <SlideHeader
                    title="MÉDIA DAS ORIGENS"
                    subTitle={`Comparativo Semanas ${numeroSemana1} vs ${numeroSemana2}`}
                />
            </header>

            {/* Main content - Simpler layout as requested */}
            <div className="flex w-full max-w-5xl justify-evenly items-center gap-12 flex-1 px-8 animate-slide-up opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>

                {/* Semana 1 */}
                <div className="flex flex-col items-center gap-6">
                    <WeekComparisonCircle
                        aderencia={media.semana1.aderencia}
                        // passamos string vazia para ocultar as horasEntregues, já que foi pedido 'apenas a média'
                        horasEntregues=""
                        label={`SEM ${numeroSemana1}`}
                        isSecond={false}
                        size="large"
                        circleSizePx={200}
                        isActive={isVisible}
                    />
                </div>

                {/* Central variation Box */}
                {variacaoAderencia && (
                    <VariacaoAderenciaBox variacaoAderencia={variacaoAderencia as any} />
                )}

                {/* Semana 2 */}
                <div className="flex flex-col items-center gap-6">
                    <WeekComparisonCircle
                        aderencia={media.semana2.aderencia}
                        horasEntregues=""
                        label={`SEM ${numeroSemana2}`}
                        isSecond={true}
                        size="large"
                        circleSizePx={200}
                        isActive={isVisible}
                    />
                </div>

            </div>
        </SlideWrapper>
    );
};

export default SlideMediaOrigens;
