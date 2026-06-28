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

    const variacaoAderencia = media.variacoes.find(v => v.label.includes('Aderência')) || media.variacoes[0];

    return (
        <SlideWrapper
            isVisible={isVisible}
            className="flex flex-col items-center justify-center"
            style={{ padding: '32px 48px' }}
        >
            <header className="mb-8 w-full flex-shrink-0 text-center">
                <SlideHeader
                    title="MÉDIA DAS ORIGENS"
                    subTitle={`Comparativo Semanas ${numeroSemana1} vs ${numeroSemana2}`}
                />
            </header>

            <div className="flex w-full max-w-5xl flex-1 animate-slide-up items-start justify-evenly gap-12 px-8 pt-8" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
                <div className="flex flex-col items-center gap-6">
                    <WeekComparisonCircle
                        aderencia={media.semana1.aderencia}
                        horasEntregues=""
                        label={`SEM ${numeroSemana1}`}
                        isSecond={false}
                        size="large"
                        circleSizePx={200}
                        isActive={isVisible}
                    />
                </div>

                {variacaoAderencia ? (
                    <VariacaoAderenciaBox variacaoAderencia={variacaoAderencia as any} />
                ) : null}

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
