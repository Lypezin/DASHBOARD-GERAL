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
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5 border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                        <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Custo por Liberado</p>
                    </div>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-200 font-mono">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(atendenteData.custoPorLiberado)}
                    </p>
                </div>
            </div>

            {/* Status da Meta */}
            {metaInfoAtendente && (
                <div className={`
        rounded-lg p-2.5 border flex items-center gap-3
        ${metaInfoAtendente.jaAtingiuMeta
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800/30'
                        : 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-800/30'
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
