import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { SlideHeader } from './components/SlideHeader';
import { AlertTriangle, Users } from 'lucide-react';

interface SlideEntregadoresProps {
    isVisible: boolean;
    numeroSemana1: string;
    numeroSemana2: string;
    entregadores: Array<{ id: string; nome: string; segundosSem1: number; segundosSem2: number }>;
}

const formatarSegundosParaHMS = (totalSegundos: number): string => {
    const absoluto = Math.abs(totalSegundos);
    const hrs = Math.floor(absoluto / 3600);
    const mins = Math.floor((absoluto % 3600) / 60);
    const secs = Math.floor(absoluto % 60);
    const pad = (num: number) => String(num).padStart(2, '0');
    const sign = totalSegundos < 0 ? '-' : '';
    return `${sign}${hrs}:${pad(mins)}:${pad(secs)}`;
};

const formatarHMSComNaoRodou = (segundos: number): React.ReactNode => {
    if (!segundos || segundos === 0) {
        return <span className="text-slate-400 dark:text-slate-500 italic font-semibold text-lg">NÃO RODOU</span>;
    }
    return <span className="text-xl font-bold font-mono">{formatarSegundosParaHMS(segundos)}</span>;
};

export const SlideEntregadores: React.FC<SlideEntregadoresProps> = ({
    isVisible,
    numeroSemana1,
    numeroSemana2,
    entregadores
}) => {
    // Total hours sum in seconds
    const totalSegundosSem1 = entregadores.reduce((sum, e) => sum + e.segundosSem1, 0);
    const totalSegundosSem2 = entregadores.reduce((sum, e) => sum + e.segundosSem2, 0);
    const diferencaSegundos = totalSegundosSem2 - totalSegundosSem1;

    // Counts
    const qtdSem1 = entregadores.filter(e => e.segundosSem1 > 0).length;
    const qtdSem2 = entregadores.filter(e => e.segundosSem2 > 0).length;
    const totalUnicos = entregadores.length;

    const renderContent = () => {
        if (!entregadores || entregadores.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center flex-1 h-full text-center p-8">
                    <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
                    <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-2">Dados de entregadores não disponíveis</h3>
                    <p className="text-lg text-slate-500 dark:text-slate-400">Não foi possível carregar os entregadores para o período.</p>
                </div>
            );
        }

        return (
            <div className="flex-1 flex flex-col justify-between w-full max-w-[1550px] mx-auto min-h-0">
                {/* Table container with expanded height and larger styles */}
                <div className="flex-1 overflow-y-auto max-h-[780px] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 subtle-scrollbar">
                    <table className="w-full border-collapse text-left">
                        <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-10">
                            <tr>
                                <th className="px-8 py-5 text-left text-base font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Entregador</th>
                                <th className="px-8 py-5 text-center text-base font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">ID</th>
                                <th className="px-8 py-5 text-center text-base font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Semana {numeroSemana1}</th>
                                <th className="px-8 py-5 text-center text-base font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Semana {numeroSemana2}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {entregadores.slice(0, 100).map((e) => (
                                <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-8 py-5 text-left text-xl font-extrabold text-slate-800 dark:text-slate-100">{e.nome}</td>
                                    <td className="px-8 py-5 text-center text-sm font-semibold font-mono text-slate-400 dark:text-slate-500">{e.id}</td>
                                    <td className="px-8 py-5 text-center text-slate-600 dark:text-slate-400">
                                        {formatarHMSComNaoRodou(e.segundosSem1)}
                                    </td>
                                    <td className="px-8 py-5 text-center text-slate-800 dark:text-slate-200">
                                        {formatarHMSComNaoRodou(e.segundosSem2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Subtotal & stats 2-column footer card (Enlarged sizes) */}
                <div className="mt-6 grid grid-cols-2 gap-6">
                    {/* Card 1: Soma Total das Horas */}
                    <div className="bg-slate-900 text-white dark:bg-white dark:text-slate-950 p-5 rounded-2xl flex items-center justify-between shadow-xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-4">
                            <Users className="h-7 w-7 text-sky-400 dark:text-sky-600" />
                            <span className="text-base font-black uppercase tracking-wider">Soma Total das Horas</span>
                        </div>
                        <div className="flex gap-8 font-mono text-xl font-bold">
                            <div>
                                <span className="text-xs uppercase tracking-widest text-slate-400 block dark:text-slate-500 font-bold">Sem {numeroSemana1}</span>
                                <span className="text-2xl font-black">{formatarSegundosParaHMS(totalSegundosSem1)}</span>
                            </div>
                            <div className="border-l border-slate-700 dark:border-slate-200 pl-8">
                                <span className="text-xs uppercase tracking-widest text-slate-400 block dark:text-slate-500 font-bold">Sem {numeroSemana2}</span>
                                <span className="text-2xl font-black text-sky-400 dark:text-sky-600">{formatarSegundosParaHMS(totalSegundosSem2)}</span>
                            </div>
                            <div className="border-l border-slate-700 dark:border-slate-200 pl-8">
                                <span className="text-xs uppercase tracking-widest text-slate-400 block dark:text-slate-500 font-bold">Diferença</span>
                                <span className={`text-2xl font-black ${diferencaSegundos >= 0 ? "text-emerald-400 dark:text-emerald-600" : "text-rose-400 dark:text-rose-600"}`}>
                                    {formatarSegundosParaHMS(diferencaSegundos)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Quantidade de Entregadores */}
                    <div className="bg-slate-900 text-white dark:bg-white dark:text-slate-950 p-5 rounded-2xl flex items-center justify-between shadow-xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-4">
                            <Users className="h-7 w-7 text-purple-400 dark:text-purple-600" />
                            <span className="text-base font-black uppercase tracking-wider">Qtd. Entregadores</span>
                        </div>
                        <div className="flex gap-8 font-mono text-xl font-bold">
                            <div>
                                <span className="text-xs uppercase tracking-widest text-slate-400 block dark:text-slate-500 font-bold">Sem {numeroSemana1}</span>
                                <span className="text-2xl font-black">{qtdSem1}</span>
                            </div>
                            <div className="border-l border-slate-700 dark:border-slate-200 pl-8">
                                <span className="text-xs uppercase tracking-widest text-slate-400 block dark:text-slate-500 font-bold">Sem {numeroSemana2}</span>
                                <span className="text-2xl font-black text-purple-400 dark:text-purple-600">{qtdSem2}</span>
                            </div>
                            <div className="border-l border-slate-700 dark:border-slate-200 pl-8">
                                <span className="text-xs uppercase tracking-widest text-slate-400 block dark:text-slate-500 font-bold">Total Únicos</span>
                                <span className="text-2xl font-black text-emerald-400 dark:text-emerald-600">{totalUnicos}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <SlideWrapper isVisible={isVisible} style={{ padding: '32px 48px' }}>
            <SlideHeader
                title="Horas de Entregadores"
                subTitle={`Comparativo Semanas ${numeroSemana1} vs ${numeroSemana2}`}
            />
            {renderContent()}
        </SlideWrapper>
    );
};

export default SlideEntregadores;
