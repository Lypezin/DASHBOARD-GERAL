import React from 'react';
import { ComparacaoMetrics } from './ComparacaoMetrics';
import { ComparacaoOrigemSection } from './ComparacaoOrigemSection';
import { ComparacaoDailyOverview } from './ComparacaoDailyOverview';
import { Section } from './ComparacaoSectionWrapper';
import { ComparacaoOrigemDetalhada } from './ComparacaoOrigemDetalhada';
import { ComparacaoUtrSection } from './ComparacaoUtrSection';
import { ComparacaoDiaTable } from './ComparacaoDiaTable';
import { ComparacaoDetailedCard } from './ComparacaoDetailedCard';

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
    const sv = state.secoesVisiveis;

    if (data.dadosComparacao.length === 0) {
        if (data.utrComparacao.length === 0 || !sv.utr) return null;

        return (
            <Section show={sv.utr}>
                <ComparacaoUtrSection
                    utrComparacao={data.utrComparacao}
                    semanasSelecionadas={state.semanasSelecionadas}
                    loading={data.loading}
                    utrError={data.utrError}
                    onRetry={actions.retryData}
                />
            </Section>
        );
    }

    return (
        <div className="space-y-5">
            <Section show={sv.metricas}>
                <ComparacaoMetrics dadosComparacao={data.dadosComparacao} />
            </Section>

            <Section show={sv.detalhada}>
                <ComparacaoDetailedCard
                    dadosComparacao={data.dadosComparacao}
                    semanasSelecionadas={state.semanasSelecionadas}
                    viewMode={state.viewModeDetalhada}
                    onViewModeChange={actions.setViewModeDetalhada}
                />
            </Section>

            <Section show={sv.por_dia}>
                <ComparacaoDiaTable
                    dadosComparacao={data.dadosComparacao}
                    semanasSelecionadas={state.semanasSelecionadas}
                />
            </Section>

            <ComparacaoDailyOverview data={data} state={state} actions={actions} sv={sv} />

            <Section show={sv.por_origem}>
                <ComparacaoOrigemSection
                    dadosComparacao={data.dadosComparacao}
                    semanasSelecionadas={state.semanasSelecionadas}
                    viewMode={state.viewModeOrigem}
                    onViewModeChange={actions.setViewModeOrigem}
                    origensDisponiveis={data.origensDisponiveis}
                    totalColunasOrigem={data.totalColunasOrigem}
                />
            </Section>

            <Section show={sv.origem_detalhada}>
                <ComparacaoOrigemDetalhada
                    dadosComparacao={data.dadosComparacao}
                    semanasSelecionadas={state.semanasSelecionadas}
                />
            </Section>

            <Section show={sv.utr}>
                <ComparacaoUtrSection
                    utrComparacao={data.utrComparacao}
                    semanasSelecionadas={state.semanasSelecionadas}
                    loading={data.loading}
                    utrError={data.utrError}
                    onRetry={actions.retryData}
                />
            </Section>
        </div>
    );
});
