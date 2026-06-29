import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { SlideHeader } from './components/SlideHeader';
import { DemandaOrigemItem } from '@/utils/apresentacao/processors/demandaOrigem';

interface SlideResumoDemandaOrigemProps {
    isVisible: boolean;
    numeroSemana1: string;
    numeroSemana2: string;
    paginaAtual: number;
    totalPaginas: number;
    itens: DemandaOrigemItem[];
}

const SlideResumoDemandaOrigem: React.FC<SlideResumoDemandaOrigemProps> = ({
    isVisible,
    numeroSemana1,
    numeroSemana2,
    paginaAtual,
    totalPaginas,
    itens,
}) => {
    const getMetrica = (item: DemandaOrigemItem, label: string) => {
        return item.metricas.find(m => m.label.toLowerCase() === label.toLowerCase()) || {
            semana1Valor: '0',
            semana2Valor: '0',
            variacaoValor: '0',
            variacaoPercentual: '0.0%',
            variacaoPositiva: true,
            variacaoPercentualPositiva: true
        };
    };

    return (
        <SlideWrapper isVisible={isVisible} style={{ padding: '32px 48px' }}>
            <SlideHeader
                title="TABELA RESUMO DE DEMANDA POR ORIGEM"
                subTitle={`Comparativo Semanas ${numeroSemana1} vs ${numeroSemana2}`}
            />

            {totalPaginas > 1 && (
                <p className="text-center text-base font-semibold text-slate-400 -mt-4 mb-3">
                    Página {paginaAtual} de {totalPaginas}
                </p>
            )}

            <div className="flex-1 w-full max-w-[1600px] mx-auto flex items-start justify-center pt-2">
                <div className="w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            {/* Main headers */}
                            <tr className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-black uppercase border-b-2 border-slate-200 dark:border-slate-700">
                                <th className="px-5 py-4 text-left font-extrabold text-blue-600 dark:text-blue-400 text-sm">Origem</th>
                                <th colSpan={3} className="px-3 py-4 text-center border-l border-slate-200 dark:border-slate-700 font-extrabold text-slate-700 dark:text-slate-300">Ofertadas</th>
                                <th colSpan={3} className="px-3 py-4 text-center border-l border-slate-200 dark:border-slate-700 font-extrabold text-slate-700 dark:text-slate-300">Aceitas</th>
                                <th colSpan={3} className="px-3 py-4 text-center border-l border-slate-200 dark:border-slate-700 font-extrabold text-slate-700 dark:text-slate-300">Nº Pedidos</th>
                                <th colSpan={3} className="px-3 py-4 text-center border-l border-slate-200 dark:border-slate-700 font-extrabold text-slate-700 dark:text-slate-300">Rejeitadas</th>
                            </tr>
                            {/* Sub headers */}
                            <tr className="bg-slate-100/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase border-b border-slate-200 dark:border-slate-700">
                                <th className="px-5 py-2.5 text-left"></th>
                                <th className="px-2 py-2.5 text-center border-l border-slate-200 dark:border-slate-700">Sem {numeroSemana1}</th>
                                <th className="px-2 py-2.5 text-center">Sem {numeroSemana2}</th>
                                <th className="px-2 py-2.5 text-center">Var</th>
                                <th className="px-2 py-2.5 text-center border-l border-slate-200 dark:border-slate-700">Sem {numeroSemana1}</th>
                                <th className="px-2 py-2.5 text-center">Sem {numeroSemana2}</th>
                                <th className="px-2 py-2.5 text-center">Var</th>
                                <th className="px-2 py-2.5 text-center border-l border-slate-200 dark:border-slate-700">Sem {numeroSemana1}</th>
                                <th className="px-2 py-2.5 text-center">Sem {numeroSemana2}</th>
                                <th className="px-2 py-2.5 text-center">Var</th>
                                <th className="px-2 py-2.5 text-center border-l border-slate-200 dark:border-slate-700">Sem {numeroSemana1}</th>
                                <th className="px-2 py-2.5 text-center">Sem {numeroSemana2}</th>
                                <th className="px-2 py-2.5 text-center">Var</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                            {itens.map((item) => {
                                const mOfertadas = getMetrica(item, 'Ofertadas');
                                const mAceitas = getMetrica(item, 'Aceitas');
                                const mPedidos = getMetrica(item, 'Numero de Pedidos');
                                const mRejeitadas = getMetrica(item, 'Rejeitadas');

                                const renderVarBadge = (metrica: typeof mOfertadas) => {
                                    const isPositive = metrica.variacaoPositiva;
                                    return (
                                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                                            isPositive 
                                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/20' 
                                                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/20'
                                        }`}>
                                            <span>{isPositive ? '▲' : '▼'}</span>
                                            <span>{metrica.variacaoValor} <span className="opacity-75 font-semibold text-[9px]">({metrica.variacaoPercentual})</span></span>
                                        </span>
                                    );
                                };

                                return (
                                    <tr 
                                        key={item.nome} 
                                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors odd:bg-white even:bg-slate-50/20 dark:odd:bg-slate-900 dark:even:bg-slate-850/10"
                                    >
                                        {/* Name */}
                                        <td className="px-5 py-3 text-left font-bold text-slate-800 dark:text-slate-100 text-[12px] tracking-wide uppercase truncate max-w-[200px]" title={item.nome}>
                                            {item.nome}
                                        </td>
                                        
                                        {/* Ofertadas Sem 1 */}
                                        <td className="px-2 py-3 text-center border-l border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                                            {mOfertadas.semana1Valor}
                                        </td>
                                        {/* Ofertadas Sem 2 */}
                                        <td className="px-2 py-3 text-center font-bold text-slate-800 dark:text-slate-100 text-xs">
                                            {mOfertadas.semana2Valor}
                                        </td>
                                        {/* Ofertadas Var */}
                                        <td className="px-2 py-3 text-center">
                                            {renderVarBadge(mOfertadas)}
                                        </td>

                                        {/* Aceitas Sem 1 */}
                                        <td className="px-2 py-3 text-center border-l border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                                            {mAceitas.semana1Valor}
                                        </td>
                                        {/* Aceitas Sem 2 */}
                                        <td className="px-2 py-3 text-center font-bold text-slate-800 dark:text-slate-100 text-xs">
                                            {mAceitas.semana2Valor}
                                        </td>
                                        {/* Aceitas Var */}
                                        <td className="px-2 py-3 text-center">
                                            {renderVarBadge(mAceitas)}
                                        </td>

                                        {/* Pedidos Sem 1 */}
                                        <td className="px-2 py-3 text-center border-l border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                                            {mPedidos.semana1Valor}
                                        </td>
                                        {/* Pedidos Sem 2 */}
                                        <td className="px-2 py-3 text-center font-bold text-slate-800 dark:text-slate-100 text-xs">
                                            {mPedidos.semana2Valor}
                                        </td>
                                        {/* Pedidos Var */}
                                        <td className="px-2 py-3 text-center">
                                            {renderVarBadge(mPedidos)}
                                        </td>

                                        {/* Rejeitadas Sem 1 */}
                                        <td className="px-2 py-3 text-center border-l border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                                            {mRejeitadas.semana1Valor}
                                        </td>
                                        {/* Rejeitadas Sem 2 */}
                                        <td className="px-2 py-3 text-center font-bold text-slate-800 dark:text-slate-100 text-xs">
                                            {mRejeitadas.semana2Valor}
                                        </td>
                                        {/* Rejeitadas Var */}
                                        <td className="px-2 py-3 text-center">
                                            {renderVarBadge(mRejeitadas)}
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

export default SlideResumoDemandaOrigem;
