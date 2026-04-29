import React from 'react';
import { Target, CheckCircle2 } from 'lucide-react';
import { MetaInfo, META_CUSTO } from '@/utils/resultados/metaCalculations';
import { AtendenteData } from '../AtendenteCard';

interface AtendenteMetaStatusProps {
    atendenteData: AtendenteData;
    metaInfoAtendente: MetaInfo | null;
}

export const AtendenteMetaStatus = ({ atendenteData, metaInfoAtendente }: AtendenteMetaStatusProps) => {
    if (atendenteData.custoPorLiberado === undefined || atendenteData.custoPorLiberado <= 0) return null;

    const currencyFormat = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="space-y-2.5">
            {/* Custo por Liberado */}
            <div className="rounded-lg bg-slate-50/80 dark:bg-slate-800/40 px-3 py-2.5 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <Target className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Custo por Liberado</span>
                    </div>
                    <span className="text-base font-bold text-slate-800 dark:text-slate-100 font-mono tabular-nums">
                        {currencyFormat.format(atendenteData.custoPorLiberado)}
                    </span>
                </div>
            </div>

            {/* Status da Meta */}
            {metaInfoAtendente && (
                <div className={`
                    rounded-lg px-3 py-2.5 border flex items-center gap-3
                    ${metaInfoAtendente.jaAtingiuMeta
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/30'
                        : 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/30'
                    }
                `}>
                    {metaInfoAtendente.jaAtingiuMeta ? (
                        <>
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                    Meta atingida
                                </p>
                                <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/70">
                                    Abaixo de {currencyFormat.format(META_CUSTO)}
                                </p>
                            </div>
                        </>
                    ) : metaInfoAtendente.faltamLiberados > 0 ? (
                        <>
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
                                <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                                    Faltam <span className="font-bold tabular-nums">{metaInfoAtendente.faltamLiberados}</span> liberados
                                </p>
                                <p className="text-[10px] text-amber-600/80 dark:text-amber-400/70">
                                    Para atingir {currencyFormat.format(META_CUSTO)}
                                </p>
                            </div>
                        </>
                    ) : null}
                </div>
            )}
        </div>
    );
};
