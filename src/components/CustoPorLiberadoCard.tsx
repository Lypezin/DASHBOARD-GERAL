'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, CheckCircle2, Target } from 'lucide-react';

interface CustoPorLiberadoCardProps {
    cidade: string;
    custoPorLiberado: number;
    quantidadeLiberados: number;
    valorTotalEnviados: number;
    color?: 'blue' | 'green' | 'purple' | 'orange';
}

const CustoPorLiberadoCard: React.FC<CustoPorLiberadoCardProps> = ({
    cidade,
    custoPorLiberado,
    quantidadeLiberados,
    valorTotalEnviados,
    color = 'blue',
}) => {
    const colorClasses: Record<string, { gradient: string; bg: string; text: string; icon: string }> = {
        blue: {
            gradient: 'from-sky-500 to-blue-500',
            bg: 'bg-sky-50 dark:bg-sky-950/30',
            text: 'text-sky-700 dark:text-sky-300',
            icon: 'text-sky-500',
        },
        green: {
            gradient: 'from-emerald-500 to-teal-500',
            bg: 'bg-emerald-50 dark:bg-emerald-950/30',
            text: 'text-emerald-700 dark:text-emerald-300',
            icon: 'text-emerald-500',
        },
        purple: {
            gradient: 'from-sky-500 to-blue-500',
            bg: 'bg-sky-50 dark:bg-sky-950/30',
            text: 'text-sky-700 dark:text-sky-300',
            icon: 'text-sky-500',
        },
        orange: {
            gradient: 'from-orange-500 to-amber-500',
            bg: 'bg-orange-50 dark:bg-orange-950/30',
            text: 'text-orange-700 dark:text-orange-300',
            icon: 'text-orange-500',
        },
    };

    const colors = colorClasses[color];

    const META_CUSTO = 50;
    let faltamLiberados = 0;
    let jaAtingiuMeta = false;

    if (custoPorLiberado > META_CUSTO && quantidadeLiberados > 0) {
        faltamLiberados = Math.ceil((valorTotalEnviados - META_CUSTO * quantidadeLiberados) / META_CUSTO);
        if (faltamLiberados < 0) {
            faltamLiberados = 0;
        }
    } else if (custoPorLiberado <= META_CUSTO && custoPorLiberado > 0) {
        jaAtingiuMeta = true;
    }

    const formatCurrency = (val: number): string => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(val);
    };

    return (
        <Card className="overflow-hidden border-slate-200/70 bg-white/90 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-md dark:border-slate-800/70 dark:bg-slate-900/85">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="truncate pr-3 text-sm font-medium text-muted-foreground" title={cidade}>
                    {cidade} - Custo/Liberado
                </CardTitle>
                <div className={`rounded-xl bg-gradient-to-br p-2 text-white shadow-sm ${colors.gradient}`}>
                    <BarChart3 className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                    {formatCurrency(custoPorLiberado)}
                </div>

                {jaAtingiuMeta ? (
                    <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                Meta atingida. Abaixo de {formatCurrency(META_CUSTO)}.
                            </p>
                        </div>
                    </div>
                ) : faltamLiberados > 0 ? (
                    <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                        <div className="flex items-start gap-2">
                            <Target className={`mt-0.5 h-4 w-4 shrink-0 ${colors.icon}`} />
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                Faltam <span className={`font-bold ${colors.text}`}>{faltamLiberados}</span> para chegar a {formatCurrency(META_CUSTO)}.
                            </p>
                        </div>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
};

export default CustoPorLiberadoCard;
