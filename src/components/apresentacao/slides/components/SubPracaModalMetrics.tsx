import React from 'react';
import { SubPracaComparativo } from '../SlideSubPracas';

export const SubPracaModalMetrics = ({ selectedItem }: { selectedItem: SubPracaComparativo }) => (
    <div className="grid grid-cols-2 gap-8 border-t border-slate-100 pt-8">
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Planejado vs Realizado</h4>
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Total Planejado</p>
                    <p className="text-xl font-bold text-slate-700">{selectedItem.horasPlanejadas}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-400 font-semibold uppercase">Última Semana</p>
                    <p className="text-xl font-bold text-blue-600">{selectedItem.semana2.horasEntregues}</p>
                </div>
            </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Variação de Performance</h4>
            <div className="flex gap-4">
                {selectedItem.variacoes.map((v) => (
                    <div key={v.label} className={`flex-1 rounded-lg p-2 text-center border ${v.positivo ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-rose-100 border-rose-200 text-rose-700'}`}>
                        <p className="text-[0.6rem] font-bold uppercase opacity-70 mb-1">{v.label}</p>
                        <p className="text-lg font-black leading-none">{v.valor}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
);
