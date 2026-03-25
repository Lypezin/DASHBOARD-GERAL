'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Presentation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useHeaderAuth } from '@/hooks/auth/useHeaderAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';
import { MarketingCityFilter } from './components/MarketingCityFilter';
import MarketingDateFilterComponent from '@/components/MarketingDateFilter';

const MarketingPresentationView = React.memo(function MarketingPresentationView() {
    const { user, isLoading } = useHeaderAuth();
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    
    const [presentationFilters, setPresentationFilters] = useState<{
        dataInicial: string | null;
        dataFinal: string | null;
        praca: string | null;
    }>({
        dataInicial: null,
        dataFinal: null,
        praca: null
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const isMarketing = user?.role === 'marketing' || user?.role === 'admin' || user?.role === 'master' || user?.is_admin;

    const formatDate = (date?: string | null) => {
        if (!date) return null;
        try {
            return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        } catch {
            return date;
        }
    };

    const periodLabel = presentationFilters.dataInicial || presentationFilters.dataFinal
        ? `${presentationFilters.dataInicial ? formatDate(presentationFilters.dataInicial) : '...'} – ${presentationFilters.dataFinal ? formatDate(presentationFilters.dataFinal) : '...'} `
        : 'Todo o período';

    const pracaLabel = presentationFilters.praca || 'Todas as praças';

    const handleOpenPresentation = () => {
        if (!isMarketing) {
            toast.error('Acesso restrito', {
                description: 'Apenas usuários do Marketing podem acessar esta apresentação.'
            });
            return;
        }

        setIsGenerating(true);

        const params = new URLSearchParams();
        if (presentationFilters.dataInicial) params.set('dataInicial', presentationFilters.dataInicial);
        if (presentationFilters.dataFinal) params.set('dataFinal', presentationFilters.dataFinal);
        if (presentationFilters.praca) params.set('praca', presentationFilters.praca);
        
        const queryString = params.toString();
        router.push(`/apresentacao/marketing${queryString ? `?${queryString}` : ''}`);
    };

    if (isLoading) return null;

    return (
        <div className="space-y-8 animate-fade-in pb-12 pt-4 relative overflow-hidden">
            {/* Background Orbs para Efeito Premium */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-1">
                    <h1 className={`text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Mkt <span className="text-blue-500">Presentation</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        Gere relatórios de alto impacto visual em segundos.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        className="rounded-xl border border-slate-200 dark:border-slate-800"
                        onClick={() => router.push('/?tab=marketing')}
                    >
                        Voltar
                    </Button>
                    <Button
                        size="lg"
                        className={`rounded-xl px-8 font-bold shadow-xl transition-all hover:scale-105 active:scale-95 ${
                            isDark 
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200/50'
                        }`}
                        disabled={!isMarketing || isGenerating}
                        onClick={handleOpenPresentation}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                PREPARANDO...
                            </>
                        ) : (
                            <>
                                <Presentation className="mr-2 h-5 w-5" />
                                GERAR AGORA
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="flex justify-center relative z-10">
                {/* Lateral de Configuração - Agora Centralizado */}
                <div className="w-full max-w-2xl space-y-6">
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
                                    filters={presentationFilters as any}
                                    setFilters={setPresentationFilters as any}
                                />
                                <MarketingDateFilterComponent
                                    label="Filtro de Período"
                                    filter={presentationFilters}
                                    onFilterChange={(filter) => setPresentationFilters(prev => ({ ...prev, ...filter }))}
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
                                    onClick={handleOpenPresentation}
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
                </div>
            </div>
        </div>
    );
});

MarketingPresentationView.displayName = 'MarketingPresentationView';

export default MarketingPresentationView;
