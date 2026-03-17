'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Presentation, ExternalLink, Sparkles, Layout, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useHeaderAuth } from '@/hooks/auth/useHeaderAuth';
import { toast } from 'sonner';
import { MarketingDateFilter, MarketingFilters } from '@/types';
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
            <Card className="border-none shadow-xl bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                
                <CardHeader className="relative z-10 pb-6 pt-10 px-8 text-center max-w-2xl mx-auto">
                    <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-xl shadow-purple-500/30 mb-6 group">
                        <Presentation className="h-10 w-10 text-white" />
                    </div>
                    <CardTitle className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-4">
                        Apresentação de Resultados
                        <Sparkles className="h-5 w-5 text-purple-500 inline ml-2 animate-pulse" />
                    </CardTitle>
                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        Configure o período desejado e gere a apresentação oficial. 
                        Os slides serão gerados automaticamente com base nos filtros selecionados.
                    </p>
                </CardHeader>

                <CardContent className="relative z-10 px-8 pb-12">
                    <div className="max-w-md mx-auto mb-10 space-y-6">
                        <div className="flex items-center gap-2 mb-2 justify-center">
                            <Calendar className="h-4 w-4 text-purple-500" />
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Período e Localização</span>
                        </div>
                        
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

                    <div className="flex flex-col items-center gap-4 border-t border-slate-100 dark:border-slate-800 pt-10">
                        <Button
                            onClick={handleOpenPresentation}
                            size="lg"
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-10 py-7 text-lg font-bold rounded-2xl shadow-xl shadow-purple-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                        >
                            <Presentation className="h-6 w-6" />
                            Gerar Apresentação Agora
                            <ExternalLink className="h-5 w-5 opacity-50" />
                        </Button>
                        <p className="text-xs text-slate-400 font-medium italic">
                            {isMarketing ? 'Acesso liberado para seu perfil.' : 'Acesso restrito à equipe de Marketing.'}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Preview Section - Simpler version */}
            <div className="mt-12 text-center">
                <div className="max-w-2xl mx-auto rounded-3xl border-4 border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden aspect-[21/9] bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center relative">
                    <div className="flex flex-col items-center text-center p-6">
                        <div className="w-12 h-1 bg-blue-500 rounded-full mb-4" />
                        <h4 className="text-2xl font-black text-slate-400 dark:text-slate-600 uppercase tracking-tighter">PREVIEW DA ESTRUTURA</h4>
                        <p className="text-slate-400 dark:text-slate-700 font-bold uppercase tracking-widest text-xs">Capa • Resumo de Totais • Detalhes por Cidade</p>
                    </div>
                </div>
            </div>
        </div>
    );
});

MarketingPresentationView.displayName = 'MarketingPresentationView';

export default MarketingPresentationView;
