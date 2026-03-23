import React from 'react';
import { SubPracaComparativo } from '../SlideSubPracas';

export const SubPracaModalMetrics = ({ selectedItem }: { selectedItem: SubPracaComparativo }) => (
    <div className="grid grid-cols-2 gap-8 border-t border-slate-100 pt-8">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-700/50">
            <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Planejado vs Realizado</h4>
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase">Total Planejado Sem 2</p>
                    <p className="text-xl font-bold text-slate-700 dark:text-slate-200">{selectedItem.semana2.horasPlanejadas}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase">Realizado Sem 2</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{selectedItem.semana2.horasEntregues}</p>
                </div>
            </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-700/50">
            <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Variação de Performance</h4>
            <div className="flex gap-4">
                {selectedItem.variacoes.map((v) => (
                    <div key={v.label} className={`flex-1 rounded-lg p-2 text-center border ${v.positivo ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400'}`}>
                        <p className="text-[0.6rem] font-bold uppercase opacity-70 mb-1">{v.label}</p>
                        <p className="text-lg font-black leading-none">{v.valor}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
);
