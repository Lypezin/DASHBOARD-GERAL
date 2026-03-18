'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Presentation, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useHeaderAuth } from '@/hooks/auth/useHeaderAuth';
import { toast } from 'sonner';
import { MarketingCityFilter } from './components/MarketingCityFilter';
import MarketingDateFilterComponent from '@/components/MarketingDateFilter';

const MarketingPresentationView = React.memo(function MarketingPresentationView() {
    const { user, isLoading } = useHeaderAuth();
    const router = useRouter();
    
    // Estado local para os filtros da apresentação
    const [presentationFilters, setPresentationFilters] = useState<{
        dataInicial: string | null;
        dataFinal: string | null;
        praca: string | null;
    }>({
        dataInicial: null,
        dataFinal: null,
        praca: null
    });

    const isMarketing = user?.role === 'marketing' || user?.role === 'admin' || user?.role === 'master' || user?.is_admin;

    const handleOpenPresentation = () => {
        if (!isMarketing) {
            toast.error('Acesso restrito', {
                description: 'Apenas usuários do Marketing podem acessar esta apresentação.'
            });
            return;
        }

        const params = new URLSearchParams();
        if (presentationFilters.dataInicial) params.set('dataInicial', presentationFilters.dataInicial);
        if (presentationFilters.dataFinal) params.set('dataFinal', presentationFilters.dataFinal);
        if (presentationFilters.praca) params.set('praca', presentationFilters.praca);
        
        const queryString = params.toString();
        router.push(`/apresentacao/marketing${queryString ? `?${queryString}` : ''}`);
    };

    if (isLoading) return null;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex items-center gap-3 px-2">
                <div className="h-8 w-1.5 rounded-full bg-gradient-to-b from-indigo-500 to-purple-600 shadow-sm" />
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Apresentação</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        Monte sua apresentação com os principais indicadores e gere os slides automaticamente.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
                {/* Configuração */}
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800 overflow-hidden group">
                    <div className="h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 opacity-70 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="pt-6 pb-2 px-6">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                                <Presentation className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">Configurar apresentação</CardTitle>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Escolha período e praça antes de gerar a apresentação oficial.
                                </p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="px-6 pb-4 space-y-6">
                        <div className="grid gap-4">
                            <MarketingCityFilter
                                filters={presentationFilters as any}
                                setFilters={setPresentationFilters as any}
                            />
                            <MarketingDateFilterComponent
                                label="Período"
                                filter={presentationFilters}
                                onFilterChange={(filter) => setPresentationFilters(prev => ({ ...prev, ...filter }))}
                            />
                        </div>
                    </CardContent>

                    <CardFooter className="px-6 pt-0 pb-6">
                        <Button
                            onClick={handleOpenPresentation}
                            size="lg"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 text-lg font-bold rounded-2xl shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                        >
                            <Presentation className="h-5 w-5" />
                            Gerar Apresentação Agora
                            <ExternalLink className="h-4 w-4 opacity-70" />
                        </Button>

                        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500 font-medium text-center">
                            {isMarketing ? 'Acesso liberado para seu perfil.' : 'Acesso restrito à equipe de Marketing.'}
                        </p>
                    </CardFooter>
                </Card>

                {/* Pré‑visualização */}
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800 overflow-hidden group">
                    <div className="h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 opacity-70 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="pt-6 pb-2 px-6">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">Prévia da Apresentação</CardTitle>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Assim será a apresentação gerada para sua equipe.
                                </p>
                            </div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                Preview
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                        <div className="relative rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur shadow-inner overflow-hidden h-[290px] flex flex-col">
                            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200/50 dark:border-slate-800/50">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-rose-500" />
                                    <div className="h-2 w-2 rounded-full bg-amber-400" />
                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                </div>
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    Slide 1 de 4
                                </span>
                            </div>
                            <div className="flex-1 px-6 py-6 flex flex-col justify-center items-center text-center">
                                <Presentation className="h-10 w-10 text-blue-500 mb-4" />
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                    Capa + Resumo
                                </h3>
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-[80%]">
                                    A apresentação incluirá capa, principais métricas e comparação por cidade.
                                </p>
                            </div>
                            <div className="px-5 pb-5">
                                <div className="grid grid-cols-3 gap-2">
                                    {['Capa', 'Resumo', 'Cidades'].map((label) => (
                                        <div
                                            key={label}
                                            className="h-7 rounded-lg bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center text-[11px] font-semibold text-slate-500 dark:text-slate-300"
                                        >
                                            {label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
});

MarketingPresentationView.displayName = 'MarketingPresentationView';

export default MarketingPresentationView;
