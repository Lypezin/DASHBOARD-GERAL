'use client';

import React from 'react';
import SlideWrapper from '../../SlideWrapper';
import { MarketingTotals } from '@/types';
import { BarChart3, Send, CheckCircle2, Rocket, MailOpen, RotateCcw } from 'lucide-react';

interface SlideMarketingResumoProps {
    isVisible: boolean;
    totals: MarketingTotals;
    titulo?: string;
}

const SlideMarketingResumo: React.FC<SlideMarketingResumoProps> = ({
    isVisible,
    totals,
    titulo = "RESULTADOS MARKETING"
}) => {
    const metrics = [
        { label: "Criado", value: totals.criado, icon: BarChart3, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "Enviado", value: totals.enviado, icon: Send, color: "text-emerald-600", bg: "bg-emerald-100" },
        { label: "Liberado", value: totals.liberado, icon: CheckCircle2, color: "text-purple-600", bg: "bg-purple-100" },
        { label: "Rodando", value: totals.rodandoInicio, icon: Rocket, color: "text-orange-600", bg: "bg-orange-100" },
        { label: "Aberto", value: totals.aberto, icon: MailOpen, color: "text-cyan-600", bg: "bg-cyan-100" },
        { label: "Voltou", value: totals.voltou, icon: RotateCcw, color: "text-rose-600", bg: "bg-rose-100" },
    ];

    return (
        <SlideWrapper isVisible={isVisible}>
            <div className="flex flex-col h-full w-full p-12">
                <header className="mb-12 border-b-4 border-blue-600 pb-4">
                    <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tight">
                        {titulo}
                    </h2>
                </header>

                <div className="grid grid-cols-2 gap-8 flex-grow">
                    {metrics.map((metric, idx) => (
                        <div key={idx} className="bg-white rounded-3xl p-8 border-2 border-slate-100 shadow-sm flex items-center gap-6">
                            <div className={`p-5 rounded-2xl ${metric.bg}`}>
                                <metric.icon className={`h-10 w-10 ${metric.color}`} />
                            </div>
                            <div>
                                <p className="text-slate-500 font-bold uppercase tracking-wider text-sm mb-1">
                                    {metric.label}
                                </p>
                                <p className={`text-5xl font-black ${metric.color}`}>
                                    {metric.value.toLocaleString('pt-BR')}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <footer className="mt-8 flex justify-between items-center text-slate-400 font-medium">
                    <p>Relatório Gerado Automaticamente</p>
                    <div className="h-1 w-24 bg-blue-600 rounded-full" />
                </footer>
            </div>
        </SlideWrapper>
    );
};

export default SlideMarketingResumo;
