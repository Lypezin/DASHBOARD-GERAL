'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Presentation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingCityFilter } from './MarketingCityFilter';
import MarketingDateFilterComponent from '@/components/MarketingDateFilter';

interface PresentationConfigCardProps {
    isDark: boolean;
    isMarketing: boolean;
    isGenerating: boolean;
    filters: {
        dataInicial: string | null;
        dataFinal: string | null;
        praca: string | null;
    };
    setFilters: React.Dispatch<React.SetStateAction<any>>;
    onGenerate: () => void;
    pracaLabel: string;
    periodLabel: string;
}

export const PresentationConfigCard: React.FC<PresentationConfigCardProps> = ({
    isDark,
    isMarketing,
    isGenerating,
    filters,
    setFilters,
    onGenerate,
    pracaLabel,
    periodLabel
}) => {
    return (
        <Card className={`border-none shadow-2xl overflow-hidden rounded-[2rem] ${
            isDark ? 'bg-slate-900/60' : 'bg-white/80'
        } backdrop-blur-2xl ring-1 ${isDark ? 'ring-white/10' : 'ring-slate-200/50'}`}>
            <CardHeader className="p-8 pb-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-blue-600 font-bold">01</span>
                </div>
                <CardTitle className="text-2xl font-bold">Configuração do Relatório</CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400">Selecione os parâmetros para gerar a apresentação.</p>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                    <MarketingCityFilter
                        filters={filters as any}
                        setFilters={setFilters as any}
                    />
                    <MarketingDateFilterComponent
                        label="Filtro de Período"
                        filter={filters}
                        onFilterChange={(filter) => setFilters((prev: any) => ({ ...prev, ...filter }))}
                    />
                </div>
                
                <div className="h-px bg-slate-200 dark:bg-slate-800" />
                
                <div className="flex flex-col items-center gap-4 py-4">
                    <div className={`px-6 py-3 rounded-2xl border ${
                        isDark ? 'bg-slate-950/50 border-white/5' : 'bg-slate-50 border-slate-200/50'
                    } w-full text-center`}>
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Escopo Selecionado</h4>
                        <p className="text-sm font-bold">{pracaLabel} • {periodLabel}</p>
                    </div>
                    
                    <Button
                        size="lg"
                        className={`w-full h-16 rounded-2xl text-lg font-black shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] ${
                            isDark 
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200/50'
                        }`}
                        disabled={!isMarketing || isGenerating}
                        onClick={onGenerate}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                PREPARANDO APRESENTAÇÃO...
                            </>
                        ) : (
                            <>
                                <Presentation className="mr-2 h-6 w-6" />
                                GERAR APRESENTAÇÃO COMPLETA
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
