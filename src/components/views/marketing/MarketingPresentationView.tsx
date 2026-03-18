'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Presentation } from 'lucide-react';
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

    const formatDate = (date?: string | null) => {
        if (!date) return null;
        try {
            return new Date(date).toLocaleDateString('pt-BR');
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

        const params = new URLSearchParams();
        if (presentationFilters.dataInicial) params.set('dataInicial', presentationFilters.dataInicial);
        if (presentationFilters.dataFinal) params.set('dataFinal', presentationFilters.dataFinal);
        if (presentationFilters.praca) params.set('praca', presentationFilters.praca);
        
        const queryString = params.toString();
        router.push(`/apresentacao/marketing${queryString ? `?${queryString}` : ''}`);
    };

    if (isLoading) return null;

    return (
        <div className="space-y-10 animate-fade-in pb-12 pt-4">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Apresentação</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Selecione os filtros abaixo e gere a apresentação em PDF.
                    </p>
                </div>

                <Button
                    variant="outline"
                    disabled={!isMarketing}
                    onClick={handleOpenPresentation}
                >
                    <Presentation className="h-4 w-4" />
                    Gerar apresentação
                </Button>
            </header>

            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Configuração</h2>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-950 shadow-sm">
                        <CardHeader className="pb-2 px-6 pt-6">
                            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                Parâmetros
                            </CardTitle>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Selecione o período e a praça que serão usados na apresentação.
                            </p>
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

                        <CardFooter className="px-6 pt-0 pb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {isMarketing ? 'Autorizado para gerar.' : 'Somente equipe de Marketing.'}
                            </p>
                            <Button
                                variant="outline"
                                disabled={!isMarketing}
                                onClick={handleOpenPresentation}
                            >
                                Gerar slides
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-950 shadow-sm">
                        <CardHeader className="pb-2 px-6 pt-6">
                            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                Pré-visualização
                            </CardTitle>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Veja como será a apresentação com os filtros aplicados.
                            </p>
                        </CardHeader>

                        <CardContent className="px-6 pb-6 space-y-4">
                            <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/40 p-4">
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    Filtros aplicados
                                </div>
                                <dl className="mt-3 grid gap-2 text-sm text-slate-700 dark:text-slate-300">
                                    <div className="flex justify-between">
                                        <dt className="font-medium">Período</dt>
                                        <dd className="text-right">{periodLabel}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="font-medium">Praça</dt>
                                        <dd className="text-right">{pracaLabel}</dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-950 p-4">
                                <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                                    <span className="font-semibold text-slate-800 dark:text-slate-100">Slides gerados</span>
                                    <span className="text-xs uppercase tracking-wide">visão geral</span>
                                </div>
                                <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                    <li className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-600" />
                                        Capa com título e período
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-600" />
                                        Resumo de métricas gerais
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-600" />
                                        Detalhes por cidade
                                    </li>
                                </ul>
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
