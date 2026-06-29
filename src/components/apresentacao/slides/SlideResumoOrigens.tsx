import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { SlideHeader } from './components/SlideHeader';
import { OrigemProcessada } from '@/utils/apresentacao/processors/origens';

interface SlideResumoOrigensProps {
    isVisible: boolean;
    numeroSemana1: string;
    numeroSemana2: string;
    paginaAtual: number;
    totalPaginas: number;
    itens: OrigemProcessada[];
}

const SlideResumoOrigens: React.FC<SlideResumoOrigensProps> = ({
    isVisible,
    numeroSemana1,
    numeroSemana2,
    paginaAtual,
    totalPaginas,
    itens,
}) => {
    return (
        <SlideWrapper isVisible={isVisible} style={{ padding: '32px 48px' }}>
            <SlideHeader
                title="TABELA RESUMO DE ORIGENS"
                subTitle={`Comparativo Semanas ${numeroSemana1} vs ${numeroSemana2}`}
            />

            {totalPaginas > 1 && (
                <p className="text-center text-base font-semibold text-slate-400 -mt-4 mb-3">
                    Página {paginaAtual} de {totalPaginas}
                </p>
            )}

            <div className="flex-1 w-full max-w-[1550px] mx-auto flex items-start justify-center pt-2">
                <div className="w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            {/* Main headers */}
                            <tr className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold uppercase border-b-2 border-slate-200 dark:border-slate-700">
                                <th className="px-6 py-4 text-left font-extrabold text-blue-600 dark:text-blue-400">Origem</th>
                                <th colSpan={3} className="px-6 py-4 text-center border-l border-slate-200 dark:border-slate-700 font-extrabold text-slate-700 dark:text-slate-300">Aderência</th>
                                <th colSpan={3} className="px-6 py-4 text-center border-l border-slate-200 dark:border-slate-700 font-extrabold text-slate-700 dark:text-slate-300">Horas Entregues</th>
                                <th colSpan={2} className="px-6 py-4 text-center border-l border-slate-200 dark:border-slate-700 font-extrabold text-slate-700 dark:text-slate-300">Horas Planejadas</th>
                            </tr>
                            {/* Sub headers */}
                            <tr className="bg-slate-100/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase border-b border-slate-200 dark:border-slate-700">
                                <th className="px-6 py-3 text-left"></th>
                                <th className="px-4 py-3 text-center border-l border-slate-200 dark:border-slate-700">Sem {numeroSemana1}</th>
                                <th className="px-4 py-3 text-center">Sem {numeroSemana2}</th>
                                <th className="px-4 py-3 text-center">Var (p.p.)</th>
                                <th className="px-4 py-3 text-center border-l border-slate-200 dark:border-slate-700">Sem {numeroSemana1}</th>
                                <th className="px-4 py-3 text-center">Sem {numeroSemana2}</th>
                                <th className="px-4 py-3 text-center">Var (%)</th>
                                <th className="px-4 py-3 text-center border-l border-slate-200 dark:border-slate-700">Sem {numeroSemana1}</th>
                                <th className="px-4 py-3 text-center">Sem {numeroSemana2}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                            {itens.map((item) => {
                                const varHoras = item.variacoes?.[0] || { valor: '00:00:00', positivo: true };
                                const varHorasPct = item.variacoes?.[1] || { valor: '0.0%', positivo: true };
                                const varAderencia = item.variacoes?.[2] || { valor: '0.0%', positivo: true };

                                return (
                                    <tr 
                                        key={item.nome} 
                                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors odd:bg-white even:bg-slate-50/20 dark:odd:bg-slate-900 dark:even:bg-slate-850/10"
                                    >
                                        {/* Name */}
                                        <td className="px-6 py-3.5 text-left font-bold text-slate-800 dark:text-slate-100 text-sm tracking-wide uppercase truncate max-w-[280px]" title={item.nome}>
                                            {item.nome}
                                        </td>
                                        
                                        {/* Adherence Sem 1 */}
                                        <td className="px-4 py-3.5 text-center border-l border-slate-100 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-300 text-sm">
                                            {item.semana1.aderencia !== undefined ? `${item.semana1.aderencia.toFixed(1)}%` : '-'}
                                        </td>
                                        
                                        {/* Adherence Sem 2 */}
                                        <td className="px-4 py-3.5 text-center font-bold text-slate-800 dark:text-slate-100 text-sm">
                                            {item.semana2.aderencia !== undefined ? `${item.semana2.aderencia.toFixed(1)}%` : '-'}
                                        </td>
                                        
                                        {/* Adherence Var */}
                                        <td className="px-4 py-3.5 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
                                                varAderencia.positivo 
                                                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40' 
                                                    : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40'
                                            }`}>
                                                <span>{varAderencia.positivo ? '▲' : '▼'}</span>
                                                <span>{varAderencia.valor}</span>
                                            </span>
                                        </td>

                                        {/* Hours Delivered Sem 1 */}
                                        <td className="px-4 py-3.5 text-center border-l border-slate-100 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-300 text-sm">
                                            {item.semana1.horasEntregues || '-'}
                                        </td>

                                        {/* Hours Delivered Sem 2 */}
                                        <td className="px-4 py-3.5 text-center font-bold text-slate-800 dark:text-slate-100 text-sm">
                                            {item.semana2.horasEntregues || '-'}
                                        </td>

                                        {/* Hours Delivered Var */}
                                        <td className="px-4 py-3.5 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black ${
                                                varHoras.positivo 
                                                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40' 
                                                    : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40'
                                            }`}>
                                                <span>{varHoras.positivo ? '▲' : '▼'}</span>
                                                <span>{varHoras.valor} <span className="opacity-75 font-bold">({varHorasPct.valor})</span></span>
                                            </span>
                                        </td>

                                        {/* Planned Hours Sem 1 */}
                                        <td className="px-4 py-3.5 text-center border-l border-slate-100 dark:border-slate-800 font-medium text-slate-500 dark:text-slate-400 text-sm">
                                            {item.semana1.horasPlanejadas || '-'}
                                        </td>

                                        {/* Planned Hours Sem 2 */}
                                        <td className="px-4 py-3.5 text-center font-medium text-slate-600 dark:text-slate-300 text-sm">
                                            {item.semana2.horasPlanejadas || '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </SlideWrapper>
    );
};

export default SlideResumoOrigens;
