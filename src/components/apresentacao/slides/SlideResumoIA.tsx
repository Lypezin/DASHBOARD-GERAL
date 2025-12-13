import React, { useEffect, useState } from 'react';
import SlideWrapper from '../SlideWrapper';
import { SlideHeader } from './components/SlideHeader';
import { Insight } from '@/utils/apresentacao/smartInsights';

interface SlideResumoIAProps {
    isVisible: boolean;
    insights: Insight[];
}

const TypewriterText: React.FC<{ text: string; delay: number; start: boolean }> = ({ text, delay, start }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [started, setStarted] = useState(false);

    useEffect(() => {
        if (!start) {
            setDisplayedText('');
            setStarted(false);
            return;
        }

        const startTimeout = setTimeout(() => {
            setStarted(true);
        }, delay);

        return () => clearTimeout(startTimeout);
    }, [start, delay]);

    useEffect(() => {
        if (!started) return;

        let index = 0;
        const interval = setInterval(() => {
            setDisplayedText(text.substring(0, index + 1));
            index++;
            if (index > text.length) clearInterval(interval);
        }, 15); // Typing speed

        return () => clearInterval(interval);
    }, [started, text]);

    return <span>{displayedText}</span>;
};

const SlideResumoIA: React.FC<SlideResumoIAProps> = ({ isVisible, insights }) => {
    return (
        <SlideWrapper isVisible={isVisible} style={{ padding: '32px' }}>
            <SlideHeader
                title="RESUMO INTELIGENTE"
                subTitle="Análise automatizada dos principais indicadores"
            />

            <div className="flex-1 flex flex-col justify-center gap-6 max-w-4xl mx-auto w-full">
                {insights.map((insight, index) => (
                    <div
                        key={index}
                        className={`p-6 rounded-2xl border-l-4 shadow-sm transition-all duration-500 transform
                    ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}
                    ${insight.type === 'positive' ? 'bg-emerald-50 border-emerald-500' :
                                insight.type === 'negative' ? 'bg-rose-50 border-rose-500' :
                                    insight.type === 'highlight' ? 'bg-yellow-50 border-yellow-500' : 'bg-slate-50 border-blue-500'}
                `}
                        style={{ transitionDelay: `${index * 800}ms` }}
                    >
                        <div className="flex items-start gap-4">
                            <div className="text-2xl mt-1">
                                {insight.type === 'positive' ? '📈' :
                                    insight.type === 'negative' ? '📉' :
                                        insight.type === 'highlight' ? '⭐' : 'ℹ️'}
                            </div>
                            <div>
                                <p className={`text-lg font-medium ${insight.type === 'positive' ? 'text-emerald-800' :
                                        insight.type === 'negative' ? 'text-rose-800' :
                                            insight.type === 'highlight' ? 'text-yellow-800' : 'text-slate-700'}
                        `}>
                                    <TypewriterText text={insight.text} delay={index * 800 + 300} start={isVisible} />
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </SlideWrapper>
    );
};

export default SlideResumoIA;
