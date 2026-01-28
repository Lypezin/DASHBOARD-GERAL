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

    return (
        <div className="space-y-3">
            {/* Custo por Liberado */}
            <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 p-3 border border-slate-200/50 dark:border-slate-700/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <Target className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                        <p className="text-[10px] font-medium text-slate-600 dark:text-slate-300">Custo por Liberado</p>
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(atendenteData.custoPorLiberado)}
                    </p>
                </div>
            </div>

            {/* Status da Meta */}
            {metaInfoAtendente && (
                <div className={`
        rounded-xl p-3 border flex items-center gap-3
        ${metaInfoAtendente.jaAtingiuMeta
                        ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800/30'
                        : 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800/30'
                    }
      `}>
                    {metaInfoAtendente.jaAtingiuMeta ? (
                        <>
                            <div className="p-2 rounded-lg bg-emerald-500/20">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                    🎉 Meta atingida!
                                </p>
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                    Abaixo de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(META_CUSTO)}
                                </p>
                            </div>
                        </>
                    ) : metaInfoAtendente.faltamLiberados > 0 ? (
                        <>
                            <div className="p-2 rounded-lg bg-amber-500/20">
                                <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                                    Faltam <span className="font-bold text-sm">{metaInfoAtendente.faltamLiberados}</span> liberados
                                </p>
                                <p className="text-[10px] text-amber-600 dark:text-amber-400">
                                    Para atingir {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(META_CUSTO)}
                                </p>
                            </div>
                        </>
                    ) : null}
                </div>
            )}
        </div>
    );
};
