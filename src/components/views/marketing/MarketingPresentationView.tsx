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

            <div className="grid gap-8 lg:grid-cols-12 relative z-10">
                {/* Lateral de Configuração */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className={`border-none shadow-2xl overflow-hidden rounded-[2rem] ${
                        isDark ? 'bg-slate-900/60' : 'bg-white/80'
                    } backdrop-blur-2xl ring-1 ${isDark ? 'ring-white/10' : 'ring-slate-200/50'}`}>
                        <CardHeader className="p-8 pb-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                                <span className="text-blue-600 font-bold">01</span>
                            </div>
                            <CardTitle className="text-xl font-bold">Parâmetros</CardTitle>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Refine os dados da apresentação.</p>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-8">
                            <MarketingCityFilter
                                filters={presentationFilters as any}
                                setFilters={setPresentationFilters as any}
                            />
                            <div className="h-px bg-slate-200 dark:bg-slate-800" />
                            <MarketingDateFilterComponent
                                label="Filtro de Período"
                                filter={presentationFilters}
                                onFilterChange={(filter) => setPresentationFilters(prev => ({ ...prev, ...filter }))}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Prá-visualização Dinâmica */}
                <div className="lg:col-span-8 space-y-6">
                    <Card className={`border-none shadow-2xl rounded-[2rem] overflow-hidden ${
                        isDark ? 'bg-slate-900/40' : 'bg-slate-50/50'
                    } backdrop-blur-xl ring-1 ${isDark ? 'ring-white/5' : 'ring-slate-200/30'}`}>
                        <CardHeader className="p-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                                        <span className="text-emerald-600 font-bold">02</span>
                                    </div>
                                    <CardTitle className="text-xl font-bold">Draft Visual</CardTitle>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Configuração atual do relatório.</p>
                                </div>
                                <div className="text-right">
                                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest ${
                                        isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        PREVIEW PRONTO
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-8 pt-0">
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Resumo de Filtros */}
                                <div className={`p-6 rounded-3xl border ${
                                    isDark ? 'bg-slate-950/50 border-white/5' : 'bg-white border-slate-200/50'
                                } shadow-inner`}>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Escopo do Relatório</h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium opacity-60">Período Selecionado</span>
                                            <span className="text-sm font-bold">{periodLabel}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium opacity-60">Praça de Foco</span>
                                            <span className="text-sm font-bold truncate max-w-[150px]">{pracaLabel}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Checklist de Slides */}
                                <div className={`p-6 rounded-3xl border ${
                                    isDark ? 'bg-slate-950/50 border-white/5' : 'bg-white border-slate-200/50'
                                } shadow-inner`}>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Roteiro de Slides</h4>
                                    <ul className="space-y-3">
                                        {['Portada Premium', 'Funil Semanal', 'Indicadores por Cidade', 'Trafego Pago & CPA'].map((slide, i) => (
                                            <li key={i} className="flex items-center gap-3 text-sm font-bold">
                                                <div className="w-5 h-5 rounded-md bg-emerald-500/20 flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                </div>
                                                {slide}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Mock Visual do Slide */}
                            <div className="mt-8 relative group">
                                <div className={`aspect-video rounded-[1.5rem] border-4 ${
                                    isDark ? 'border-slate-800 bg-slate-950 shadow-2xl' : 'border-white bg-slate-100 shadow-xl'
                                } flex items-center justify-center relative overflow-hidden transition-transform group-hover:scale-[1.01] duration-500`}>
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-purple-600/20" />
                                    <div className="relative text-center space-y-2">
                                        <Presentation size={48} className="mx-auto mb-4 text-blue-500 opacity-50" />
                                        <p className="text-xs font-black tracking-[0.3em] uppercase opacity-40">Layout Preview</p>
                                        <h3 className="text-2xl font-black">Dashboard Marketing</h3>
                                        <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">{periodLabel}</p>
                                    </div>
                                    
                                    {/* Overlay interativo */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm cursor-pointer" onClick={handleOpenPresentation}>
                                        <div className="bg-white text-black px-6 py-3 rounded-full font-black text-xs tracking-widest">
                                            ABRIR NORE FULLSCREEN
                                        </div>
                                    </div>
                                </div>
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
