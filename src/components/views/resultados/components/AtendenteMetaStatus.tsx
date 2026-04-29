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

    const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="mt-3 space-y-2">
            {/* CPL inline */}
            <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Custo por Liberado</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono tabular-nums">
                    {fmt.format(atendenteData.custoPorLiberado)}
                </span>
            </div>

            {/* Meta status */}
            {metaInfoAtendente && (
                <div className={`flex items-center gap-2.5 rounded-lg px-3 py-2 ${
                    metaInfoAtendente.jaAtingiuMeta
                        ? 'bg-emerald-50 dark:bg-emerald-950/20'
                        : 'bg-amber-50 dark:bg-amber-950/20'
                }`}>
                    {metaInfoAtendente.jaAtingiuMeta ? (
                        <>
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            <div>
                                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Meta atingida</p>
                                <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/60">
                                    Abaixo de {fmt.format(META_CUSTO)}
                                </p>
                            </div>
                        </>
                    ) : metaInfoAtendente.faltamLiberados > 0 ? (
                        <>
                            <Target className="h-4 w-4 text-amber-500 shrink-0" />
                            <div>
                                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                                    Faltam <span className="font-bold tabular-nums">{metaInfoAtendente.faltamLiberados}</span> liberados
                                </p>
                                <p className="text-[10px] text-amber-600/80 dark:text-amber-400/60">
                                    Para atingir {fmt.format(META_CUSTO)}
                                </p>
                            </div>
                        </>
                    ) : null}
                </div>
            )}
        </div>
    );
};
