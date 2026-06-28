import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { SlideHeader } from './components/SlideHeader';
import { AlertTriangle, Users } from 'lucide-react';

interface SlideEntregadoresProps {
    isVisible: boolean;
    numeroSemana1: string;
    numeroSemana2: string;
    entregadores: Array<{ id: string; nome: string; horasSem1: number; horasSem2: number }>;
}

export const SlideEntregadores: React.FC<SlideEntregadoresProps> = ({
    isVisible,
    numeroSemana1,
    numeroSemana2,
    entregadores
}) => {
    // Total hours sum
    const totalSem1 = entregadores.reduce((sum, e) => sum + e.horasSem1, 0);
    const totalSem2 = entregadores.reduce((sum, e) => sum + e.horasSem2, 0);

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
            <div className="flex-1 flex flex-col justify-between w-full max-w-4xl mx-auto min-h-0">
                <div className="flex-1 overflow-y-auto max-h-[360px] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 subtle-scrollbar">
                    <table className="w-full border-collapse text-left">
                        <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-10">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Entregador</th>
                                <th className="px-6 py-4 text-center text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-4 text-center text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Semana {numeroSemana1}</th>
                                <th className="px-6 py-4 text-center text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Semana {numeroSemana2}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {entregadores.slice(0, 50).map((e) => (
                                <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-3.5 text-left text-sm font-bold text-slate-800 dark:text-slate-200">{e.nome}</td>
                                    <td className="px-6 py-3.5 text-center text-xs font-mono text-slate-400 dark:text-slate-500">{e.id}</td>
                                    <td className="px-6 py-3.5 text-center font-mono text-sm font-semibold text-slate-600 dark:text-slate-400">{e.horasSem1.toFixed(1)}h</td>
                                    <td className="px-6 py-3.5 text-center font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">{e.horasSem2.toFixed(1)}h</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Total sum card */}
                <div className="mt-4 bg-slate-900 text-white dark:bg-white dark:text-slate-950 p-4 rounded-xl flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-sky-400 dark:text-sky-600" />
                        <span className="text-sm font-black uppercase tracking-wider">Soma Total das Horas</span>
                    </div>
                    <div className="flex gap-6 font-mono text-lg font-bold">
                        <div>
                            <span className="text-xs uppercase tracking-widest text-slate-400 block dark:text-slate-500">Sem {numeroSemana1}</span>
                            <span>{totalSem1.toFixed(1)}h</span>
                        </div>
                        <div className="border-l border-slate-700 dark:border-slate-200 pl-6">
                            <span className="text-xs uppercase tracking-widest text-slate-400 block dark:text-slate-500">Sem {numeroSemana2}</span>
                            <span className="text-sky-400 dark:text-sky-600">{totalSem2.toFixed(1)}h</span>
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
