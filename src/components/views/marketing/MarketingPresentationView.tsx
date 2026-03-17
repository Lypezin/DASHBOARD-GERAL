'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Presentation, ExternalLink, Sparkles, Layout, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useHeaderAuth } from '@/hooks/auth/useHeaderAuth';
import { toast } from 'sonner';

const MarketingPresentationView = React.memo(function MarketingPresentationView() {
    const { user, isLoading } = useHeaderAuth();
    const router = useRouter();

    const isMarketing = user?.role === 'marketing' || user?.role === 'admin' || user?.role === 'master' || user?.is_admin;

    const handleOpenPresentation = () => {
        if (!isMarketing) {
            toast.error('Acesso restrito', {
                description: 'Apenas usuários do Marketing podem acessar esta apresentação.'
            });
            return;
        }
        router.push('/apresentacao/marketing');
    };

    if (isLoading) return null;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <Card className="border-none shadow-xl bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                
                <CardHeader className="relative z-10 pb-8 pt-10 px-8 text-center max-w-2xl mx-auto">
                    <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-xl shadow-purple-500/30 mb-6 group animate-bounce-slow">
                        <Presentation className="h-10 w-10 text-white" />
                    </div>
                    <CardTitle className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-4">
                        Apresentação de Resultados
                        <Sparkles className="h-5 w-5 text-purple-500 inline ml-2 animate-pulse" />
                    </CardTitle>
                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        Gere apresentações visuais premium para reuniões de resultados. 
                        Transforme os dados complexos em slides elegantes e prontos para impressão ou exposição.
                    </p>
                </CardHeader>

                <CardContent className="relative z-10 px-8 pb-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
                        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
                                <Layout className="h-6 w-6" />
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Design Fluid</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Layouts otimizados para visualização em telas grandes ou TV.</p>
                        </div>

                        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                            <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mb-4">
                                <Download className="h-6 w-6" />
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Pronto para Imprimir</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">PDFs otimizados com alta qualidade e fidelidade visual.</p>
                        </div>

                        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-4">
                                <Sparkles className="h-6 w-6" />
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Dados Atuais</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Sincronização em tempo real com os dados mais recentes do sistema.</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <Button
                            onClick={handleOpenPresentation}
                            size="lg"
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-10 py-7 text-lg font-bold rounded-2xl shadow-xl shadow-purple-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                        >
                            <Presentation className="h-6 w-6" />
                            Começar Apresentação
                            <ExternalLink className="h-5 w-5 opacity-50" />
                        </Button>
                        <p className="text-xs text-slate-400 font-medium">
                            {isMarketing ? 'Você possui privilégios para esta ação.' : 'Acesso restrito à equipe de Marketing.'}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Preview Section */}
            <div className="mt-12 text-center">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-8 flex items-center justify-center gap-2">
                    <Layout className="h-5 w-5 text-blue-500" />
                    Preview da Apresentação
                </h3>
                <div className="max-w-4xl mx-auto rounded-3xl border-8 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden aspect-[16/9] bg-slate-100 dark:bg-slate-900 flex items-center justify-center relative group">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />
                    <div className="relative z-20 flex flex-col items-center text-center p-8">
                        <div className="w-16 h-1 w-24 bg-blue-600 rounded-full mb-6" />
                        <h4 className="text-4xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tighter">RELATÓRIO SEMANAL</h4>
                        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-sm">Visão Geral de Resultados • Marketing</p>
                    </div>
                    <div className="absolute bottom-8 right-8 z-20 flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                    </div>
                </div>
            </div>
        </div>
    );
});

MarketingPresentationView.displayName = 'MarketingPresentationView';

export default MarketingPresentationView;
