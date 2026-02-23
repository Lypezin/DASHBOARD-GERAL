
import React from 'react';
import { motion } from 'framer-motion';
import { fadeInItem, staggerContainer } from '@/utils/animations';
import { Calendar, MapPin, Navigation, Clock, BarChart3, TrendingUp } from 'lucide-react';
import { ComparacaoMetrics } from './ComparacaoMetrics';
import { ComparacaoSection } from './ComparacaoSection';
import { ComparacaoSubPracaSection } from './ComparacaoSubPracaSection';
import { ComparacaoOrigemSection } from './ComparacaoOrigemSection';
import { ComparacaoUtrSection } from './ComparacaoUtrSection';
import { ComparacaoDiaTable } from './ComparacaoDiaTable';
import { ComparacaoDetailedCard } from './ComparacaoDetailedCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ComparacaoContentProps {
    data: any;
    state: any;
    actions: any;
}

// Section wrapper component for consistent styling
const SectionWrapper = ({ children, title, description, icon: Icon, gradient }: {
    children: React.ReactNode;
    title: string;
    description: string;
    icon: any;
    gradient: string;
}) => (
    <Card className="relative overflow-hidden border-none shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl ring-1 ring-slate-200/50 dark:ring-slate-800/50 transition-all duration-300">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 pointer-events-none`} />

        <CardHeader className="relative z-10 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className={`p-3.5 bg-gradient-to-br ${gradient.replace('/5', '')} rounded-2xl shadow-lg ring-1 ring-white/20 dark:ring-white/10 group-hover:scale-105 transition-transform duration-300`}>
                        <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent tracking-tight">
                            {title}
                        </CardTitle>
                        <CardDescription className="text-slate-500 dark:text-slate-400 font-medium font-sans">
                            {description}
                        </CardDescription>
                    </div>
                </div>
            </div>
        </CardHeader>

        <CardContent className="relative z-10 p-6">
            {children}
        </CardContent>
    </Card>
);

export const ComparacaoContent = React.memo(function ComparacaoContent({
    data,
    state,
    actions
}: ComparacaoContentProps) {
    if (data.dadosComparacao.length === 0) return null;

    return (
        <motion.div
            className="space-y-8"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
        >
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
                <SectionWrapper
                    title="Comparativo por Semana"
                    description="Análise detalhada das métricas semanais"
                    icon={TrendingUp}
                    gradient="from-emerald-500/5 via-transparent to-teal-500/5"
                >
                    <ComparacaoDiaTable
                        dadosComparacao={data.dadosComparacao}
                        semanasSelecionadas={state.semanasSelecionadas}
                    />
                </SectionWrapper>
            </motion.div>

            {/* Grid Layout for Analysis Sections */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Day of Week Section */}
                <motion.div variants={fadeInItem}>
                    <ComparacaoSection
                        title="Aderência por Dia"
                        icon={<Calendar className="h-5 w-5 text-blue-500" />}
                        description="Performance distribuída pelos dias da semana"
                        type="dia"
                        dadosComparacao={data.dadosComparacao}
                        semanasSelecionadas={state.semanasSelecionadas}
                        viewMode={state.viewModeDia}
                        onViewModeChange={actions.setViewModeDia}
                    />
                </motion.div>

                {/* Sub-praça Section */}
                <motion.div variants={fadeInItem}>
                    <ComparacaoSubPracaSection
                        dadosComparacao={data.dadosComparacao}
                        semanasSelecionadas={state.semanasSelecionadas}
                        viewMode={state.viewModeSubPraca}
                        onViewModeChange={actions.setViewModeSubPraca}
                    />
                </motion.div>
            </div>

            {/* Full Width Sections */}
            <motion.div variants={fadeInItem}>
                <ComparacaoOrigemSection
                    dadosComparacao={data.dadosComparacao}
                    semanasSelecionadas={state.semanasSelecionadas}
                    viewMode={state.viewModeOrigem}
                    onViewModeChange={actions.setViewModeOrigem}
                    origensDisponiveis={data.origensDisponiveis}
                    totalColunasOrigem={data.totalColunasOrigem}
                />
            </motion.div>

            <motion.div variants={fadeInItem}>
                <ComparacaoUtrSection
                    utrComparacao={data.utrComparacao}
                    semanasSelecionadas={state.semanasSelecionadas}
                />
            </motion.div>
        </motion.div>
    );
});


