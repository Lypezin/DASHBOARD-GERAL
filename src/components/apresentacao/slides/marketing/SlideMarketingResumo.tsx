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
        { label: "Criado", value: totals.criado, icon: BarChart3, color: "text-blue-600", bg: "bg-blue-50/50", border: "border-blue-100" },
        { label: "Enviado", value: totals.enviado, icon: Send, color: "text-emerald-600", bg: "bg-emerald-50/50", border: "border-emerald-100" },
        { label: "Liberado", value: totals.liberado, icon: CheckCircle2, color: "text-purple-600", bg: "bg-purple-50/50", border: "border-purple-100" },
        { label: "Rodando", value: totals.rodandoInicio, icon: Rocket, color: "text-orange-600", bg: "bg-orange-50/50", border: "border-orange-100" },
        { label: "Aberto", value: totals.aberto, icon: MailOpen, color: "text-cyan-600", bg: "bg-cyan-50/50", border: "border-cyan-100" },
        { label: "Voltou", value: totals.voltou, icon: RotateCcw, color: "text-rose-600", bg: "bg-rose-50/50", border: "border-rose-100" },
    ];

    return (
        <SlideWrapper isVisible={isVisible}>
            <div className="flex flex-col h-full w-full p-16 font-sans">
                <header className="mb-14 flex items-center gap-6">
                    <div className="h-10 w-2 bg-blue-600 rounded-full" />
                    <h2 className="text-5xl font-bold text-slate-800 tracking-tight">
                        {titulo}
                    </h2>
                </header>

                <div className="grid grid-cols-3 gap-6 flex-grow">
                    {metrics.map((metric, idx) => (
                        <div key={idx} className={`bg-white rounded-[32px] p-8 border ${metric.border} shadow-sm transition-all hover:shadow-md flex flex-col justify-between group`}>
                            <div className="flex justify-between items-start">
                                <div className={`p-4 rounded-2xl ${metric.bg} group-hover:scale-110 transition-transform duration-300`}>
                                    <metric.icon className={`h-8 w-8 ${metric.color}`} />
                                </div>
                                <div className="h-2 w-2 rounded-full bg-slate-200" />
                            </div>
                            
                            <div>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">
                                    {metric.label}
                                </p>
                                <p className={`text-5xl font-black ${metric.color} tracking-tighter`}>
                                    {metric.value.toLocaleString('pt-BR')}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <footer className="mt-12 flex justify-between items-center px-2">
                    <div className="flex items-center gap-3">
                        <span className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Relatório de Performance</span>
                        <div className="h-1 w-1 rounded-full bg-slate-200" />
                        <span className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Marketing Insights</span>
                    </div>
                </footer>
            </div>
        </SlideWrapper>
    );
};

export default SlideMarketingResumo;
