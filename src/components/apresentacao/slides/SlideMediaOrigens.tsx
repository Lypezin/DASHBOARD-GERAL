import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { SlideHeader } from './components/SlideHeader';
import { WeekComparisonCircle } from './components/WeekComparisonCircle';
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
                    <div className="flex flex-col items-center justify-center z-10 mx-6">
                        <div className={`rounded-3xl border-2 px-10 py-8 text-center flex flex-col items-center gap-4 shadow-xl ${variacaoAderencia.positivo
                            ? 'bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-50 border-emerald-300'
                            : 'bg-gradient-to-br from-rose-50 via-rose-100 to-rose-50 border-rose-300'
                            }`}>

                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                                Variação de Aderência
                            </p>

                            <div className={`flex items-center gap-3 px-6 py-2.5 rounded-full ${variacaoAderencia.positivo ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
                                }`}>
                                {variacaoAderencia.positivo ? (
                                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 4l-8 8h5v8h6v-8h5z" />
                                    </svg>
                                ) : (
                                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 20l8-8h-5V4H9v8H4z" />
                                    </svg>
                                )}
                                <span className="text-3xl font-black">
                                    {variacaoAderencia.valor}
                                </span>
                            </div>
                        </div>
                    </div>
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
