'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Presentation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarketingDateFilterComponent from '@/components/MarketingDateFilter';

interface PresentationConfigCardProps {
    isDark: boolean;
    isMarketing: boolean;
    isGenerating: boolean;
    filters: {
        dataInicial: string | null;
        dataFinal: string | null;
    };
    setFilters: React.Dispatch<React.SetStateAction<any>>;
    onGenerate: () => void;
    periodLabel: string;
}

export const PresentationConfigCard: React.FC<PresentationConfigCardProps> = ({
    isDark,
    isMarketing,
    isGenerating,
    filters,
    setFilters,
    onGenerate,
    periodLabel,
}) => {
    return (
        <Card
            className={`overflow-hidden rounded-[2rem] border-none shadow-2xl backdrop-blur-2xl ring-1 ${
                isDark ? 'bg-slate-900/60 ring-white/10' : 'bg-white/80 ring-slate-200/50'
            }`}
        >
            <CardHeader className="p-6 pb-4 text-center sm:p-8">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
                    <span className="font-bold text-blue-600">01</span>
                </div>
                <CardTitle className="text-2xl font-bold">Configuracao do Relatorio</CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Selecione os parametros para gerar a apresentacao.
                </p>
            </CardHeader>
            <CardContent className="space-y-8 p-6 pt-4 sm:p-8">
                <div className="flex justify-center">
                    <div className="w-full max-w-sm">
                        <MarketingDateFilterComponent
                            label="Filtro de Periodo"
                            filter={filters}
                            onFilterChange={(filter) => setFilters((prev: any) => ({ ...prev, ...filter }))}
                        />
                    </div>
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-800" />

                <div className="flex flex-col items-center gap-4 py-2 sm:py-4">
                    <div
                        className={`w-full rounded-2xl border px-5 py-3 text-center ${
                            isDark ? 'border-white/5 bg-slate-950/50' : 'border-slate-200/50 bg-slate-50'
                        }`}
                    >
                        <h4 className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">
                            Periodo Selecionado
                        </h4>
                        <p className="text-sm font-bold break-words">{periodLabel}</p>
                    </div>

                    <Button
                        size="lg"
                        className={`h-16 w-full rounded-2xl text-lg font-black shadow-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] ${
                            isDark
                                ? 'bg-blue-600 text-white shadow-blue-900/20 hover:bg-blue-500'
                                : 'bg-blue-600 text-white shadow-blue-200/50 hover:bg-blue-700'
                        }`}
                        disabled={!isMarketing || isGenerating}
                        onClick={onGenerate}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                Preparando apresentacao...
                            </>
                        ) : (
                            <>
                                <Presentation className="mr-2 h-6 w-6" />
                                Gerar apresentacao completa
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
