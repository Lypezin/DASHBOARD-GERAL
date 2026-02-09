
import React from 'react';
import { motion } from 'framer-motion';
import { fadeInItem } from '@/utils/animations';
import { Calendar, MapPin, Navigation, Clock, BarChart3 } from 'lucide-react';
import { ComparacaoMetrics } from './ComparacaoMetrics';
import { ComparacaoSection } from './ComparacaoSection';
import { ComparacaoSubPracaSection } from './ComparacaoSubPracaSection';
import { ComparacaoOrigemSection } from './ComparacaoOrigemSection';
import { ComparacaoUtrSection } from './ComparacaoUtrSection';
import { ComparacaoDiaTable } from './ComparacaoDiaTable';
import { ComparacaoDetailedCard } from './ComparacaoDetailedCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ComparacaoContentProps {
    data: any;
    state: any;
    actions: any;
}

export const ComparacaoContent = React.memo(function ComparacaoContent({
    data,
    state,
    actions
}: ComparacaoContentProps) {
    if (data.dadosComparacao.length === 0) return null;

    return (
        <React.Fragment>
            {/* Hero Metrics */}
            <motion.div variants={fadeInItem}>
                <ComparacaoMetrics dadosComparacao={data.dadosComparacao} />
            </motion.div>

            {/* Detailed Analysis Card */}
            <motion.div variants={fadeInItem}>
                <ComparacaoDetailedCard
                    dadosComparacao={data.dadosComparacao}
                    semanasSelecionadas={state.semanasSelecionadas}
                    viewMode={state.viewModeDetalhada}
                    onViewModeChange={actions.setViewModeDetalhada}
                />
            </motion.div>

            {/* Daily Comparison Table */}
            <motion.div variants={fadeInItem}>
                <ComparacaoDiaTable
                    dadosComparacao={data.dadosComparacao}
                    semanasSelecionadas={state.semanasSelecionadas}
                />
            </motion.div>

            {/* Tabbed Analysis Sections */}
            <motion.div variants={fadeInItem}>
                <Card className="relative overflow-hidden border-none shadow-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
                    {/* Decorative background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-emerald-500/5 pointer-events-none" />

                    <CardHeader className="relative z-10 pb-4 border-b border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg shadow-blue-500/20">
                                <BarChart3 className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                    Análise por Dimensão
                                </CardTitle>
                                <CardDescription className="text-slate-500 dark:text-slate-400">
                                    Explore os dados por diferentes perspectivas
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="relative z-10 p-6">
                        <Tabs defaultValue="dia" className="w-full">
                            <TabsList className="grid w-full grid-cols-4 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl mb-6">
                                <TabsTrigger
                                    value="dia"
                                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-700 rounded-lg transition-all"
                                >
                                    <Calendar className="w-4 h-4" />
                                    <span className="hidden sm:inline">Dia</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="subpraca"
                                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-700 rounded-lg transition-all"
                                >
                                    <MapPin className="w-4 h-4" />
                                    <span className="hidden sm:inline">Sub-praça</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="origem"
                                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-700 rounded-lg transition-all"
                                >
                                    <Navigation className="w-4 h-4" />
                                    <span className="hidden sm:inline">Origem</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="utr"
                                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-700 rounded-lg transition-all"
                                >
                                    <Clock className="w-4 h-4" />
                                    <span className="hidden sm:inline">UTR</span>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="dia" className="mt-0">
                                <ComparacaoSection
                                    title="Aderência por Dia da Semana"
                                    icon={<Calendar className="h-5 w-5 text-blue-500" />}
                                    description="Performance de aderência distribuída pelos dias da semana"
                                    type="dia"
                                    dadosComparacao={data.dadosComparacao}
                                    semanasSelecionadas={state.semanasSelecionadas}
                                    viewMode={state.viewModeDia}
                                    onViewModeChange={actions.setViewModeDia}
                                />
                            </TabsContent>

                            <TabsContent value="subpraca" className="mt-0">
                                <ComparacaoSubPracaSection
                                    dadosComparacao={data.dadosComparacao}
                                    semanasSelecionadas={state.semanasSelecionadas}
                                    viewMode={state.viewModeSubPraca}
                                    onViewModeChange={actions.setViewModeSubPraca}
                                />
                            </TabsContent>

                            <TabsContent value="origem" className="mt-0">
                                <ComparacaoOrigemSection
                                    dadosComparacao={data.dadosComparacao}
                                    semanasSelecionadas={state.semanasSelecionadas}
                                    viewMode={state.viewModeOrigem}
                                    onViewModeChange={actions.setViewModeOrigem}
                                    origensDisponiveis={data.origensDisponiveis}
                                    totalColunasOrigem={data.totalColunasOrigem}
                                />
                            </TabsContent>

                            <TabsContent value="utr" className="mt-0">
                                <ComparacaoUtrSection
                                    utrComparacao={data.utrComparacao}
                                    semanasSelecionadas={state.semanasSelecionadas}
                                />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </motion.div>
        </React.Fragment>
    );
});

