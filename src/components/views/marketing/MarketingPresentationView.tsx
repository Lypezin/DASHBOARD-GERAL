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
        <div className="space-y-8 animate-fade-in pb-12 pt-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Apresentação</h1>
                    <p className="text-muted-foreground">
                        Configure o período e a praça para gerar a apresentação de resultados.
                    </p>
                </div>

                <Button
                    onClick={handleOpenPresentation}
                    disabled={!isMarketing}
                    className="gap-2 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-slate-900"
                >
                    <Presentation className="h-4 w-4" />
                    {isMarketing ? 'Gerar Apresentação' : 'Acesso restrito'}
                </Button>
            </div>

            <section className="space-y-6">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Configuração</h2>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    {/* Filtros */}
                    <Card className="border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-sm">
                        <CardHeader className="pb-2 px-6 pt-6">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                                    <Presentation className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                        Parâmetros
                                    </CardTitle>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Selecione o período e a praça que serão usados na apresentação.
                                    </p>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="px-6 pb-4 space-y-6">
                            <MarketingCityFilter
                                filters={presentationFilters as any}
                                setFilters={setPresentationFilters as any}
                            />

                            <MarketingDateFilterComponent
                                label="Período"
                                filter={presentationFilters}
                                onFilterChange={(filter) => setPresentationFilters(prev => ({ ...prev, ...filter }))}
                            />
                        </CardContent>

                        <CardFooter className="px-6 pt-0 pb-6">
                            <Button
                                onClick={handleOpenPresentation}
                                disabled={!isMarketing}
                                size="lg"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base font-semibold rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-95"
                            >
                                Gerar Apresentação
                            </Button>

                            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500 font-medium text-center">
                                {isMarketing
                                    ? 'Acesso liberado para seu perfil.'
                                    : 'Acesso restrito à equipe de Marketing.'}
                            </p>
                        </CardFooter>
                    </Card>

                    {/* Preview */}
                    <Card className="border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-sm">
                        <CardHeader className="pb-2 px-6 pt-6">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                        Pré-visualização
                                    </CardTitle>
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
                            <div className="h-[280px] rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/40 p-6 flex flex-col justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-rose-500" />
                                        <div className="h-2 w-2 rounded-full bg-amber-400" />
                                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                    </div>
                                    <div className="mt-6">
                                        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                                            Estrutura de slides
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                            Capa, resumo de métricas e comparação por cidade.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    {['Capa', 'Resumo', 'Cidades'].map((label) => (
                                        <div
                                            key={label}
                                            className="flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 py-2"
                                        >
                                            {label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    );
});

MarketingPresentationView.displayName = 'MarketingPresentationView';

export default MarketingPresentationView;
