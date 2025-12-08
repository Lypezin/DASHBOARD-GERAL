import React from 'react';
import { MapPin, Send, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AtendenteCidadeData } from '@/types';
import { calcularMetaInfo, META_CUSTO } from '@/utils/resultados/metaCalculations';

interface CityMetricsListProps {
    cidades: AtendenteCidadeData[];
    atendenteNome: string;
}

export const CityMetricsList: React.FC<CityMetricsListProps> = ({ cidades, atendenteNome }) => {
    const activeCidades = cidades.filter(c => c.enviado > 0 || c.liberado > 0);

    if (activeCidades.length === 0) return null;

    return (
        <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="flex items-center gap-1.5 mb-2 flex-shrink-0">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Por Cidade ({activeCidades.length})
                </h4>
            </div>
            <div className="space-y-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 flex-1 min-h-0">
                {activeCidades.map((cidadeData) => {
                    const metaInfoCidade = calcularMetaInfo(
                        cidadeData.custoPorLiberado,
                        cidadeData.quantidadeLiberados,
                        cidadeData.valorTotal
                    );

                    return (
                        <div
                            key={`${atendenteNome}-${cidadeData.cidade}`}
                            className="rounded-md border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-2.5"
                        >
                            <p className="text-[11px] font-medium text-slate-900 dark:text-white mb-2 truncate" title={cidadeData.cidade}>
                                {cidadeData.cidade}
                            </p>
                            <div className="space-y-1.5">
                                <div className="flex flex-wrap gap-1.5">
                                    <Badge variant="outline" className="bg-background px-2 py-0.5 h-auto font-normal">
                                        <Send className="h-3 w-3 mr-1 text-muted-foreground" />
                                        <span className="text-[10px] text-muted-foreground">Enviado:</span>
                                        <span className="text-[11px] font-medium font-mono ml-1">{cidadeData.enviado.toLocaleString('pt-BR')}</span>
                                    </Badge>
                                    <Badge variant="outline" className="bg-background px-2 py-0.5 h-auto font-normal">
                                        <CheckCircle2 className="h-3 w-3 mr-1 text-muted-foreground" />
                                        <span className="text-[10px] text-muted-foreground">Liberado:</span>
                                        <span className="text-[11px] font-medium font-mono ml-1">{cidadeData.liberado.toLocaleString('pt-BR')}</span>
                                    </Badge>
                                </div>
                                {cidadeData.custoPorLiberado !== undefined && cidadeData.custoPorLiberado > 0 && (
                                    <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                                        <Badge variant="outline" className="bg-background px-2 py-0.5 w-full justify-start h-auto font-normal">
                                            <span className="text-[10px] text-muted-foreground">Custo/Lib:</span>
                                            <span className="text-[11px] font-medium font-mono ml-1">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cidadeData.custoPorLiberado)}
                                            </span>
                                        </Badge>
                                        {metaInfoCidade && (
                                            <Badge
                                                variant="outline"
                                                className={`px-2 py-0.5 w-full justify-start h-auto font-normal ${metaInfoCidade.jaAtingiuMeta
                                                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                                    : 'bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30 text-orange-700 dark:text-orange-300'
                                                    }`}
                                            >
                                                {metaInfoCidade.jaAtingiuMeta ? (
                                                    <><CheckCircle2 className="h-3 w-3 mr-1" /><span className="text-[10px]">Meta atingida!</span></>
                                                ) : metaInfoCidade.faltamLiberados > 0 ? (
                                                    <><span className="text-[10px] mr-1">🎯</span><span className="text-[10px]">Faltam <span className="font-bold">{metaInfoCidade.faltamLiberados}</span> para meta</span></>
                                                ) : null}
                                            </Badge>
                                        )}
                                        {cidadeData.quantidadeLiberados !== undefined && cidadeData.quantidadeLiberados > 0 && cidadeData.valorTotal !== undefined && cidadeData.valorTotal > 0 && (
                                            <p className="text-[9px] text-muted-foreground mt-1 px-1">
                                                {cidadeData.quantidadeLiberados} liberado{cidadeData.quantidadeLiberados !== 1 ? 's' : ''} • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cidadeData.valorTotal)} total
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
