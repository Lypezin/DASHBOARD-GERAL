import React from 'react';
import { Calendar } from 'lucide-react';
import { ComparacaoSection } from './ComparacaoSection';
import { ComparacaoSubPracaSection } from './ComparacaoSubPracaSection';
import { Section } from './ComparacaoSectionWrapper';

interface Props {
  data: any;
  state: any;
  actions: any;
  sv: any;
}

export const ComparacaoDailyOverview: React.FC<Props> = ({ data, state, actions, sv }) => (
    <>
        <Section show={sv.aderencia_dia}>
            <ComparacaoSection
                title="Aderência por Dia"
                icon={<Calendar className="h-5 w-5" />}
                description=""
                type="dia"
                dadosComparacao={data.dadosComparacao}
                semanasSelecionadas={state.semanasSelecionadas}
                viewMode={state.viewModeDia}
                onViewModeChange={actions.setViewModeDia}
            />
        </Section>

        <Section show={sv.sub_praca}>
            <ComparacaoSubPracaSection
                dadosComparacao={data.dadosComparacao}
                semanasSelecionadas={state.semanasSelecionadas}
                viewMode={state.viewModeSubPraca}
                onViewModeChange={actions.setViewModeSubPraca}
            />
        </Section>
    </>
);
