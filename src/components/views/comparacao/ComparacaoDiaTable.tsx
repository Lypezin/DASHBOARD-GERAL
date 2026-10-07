import React from 'react';
import { DashboardResumoData } from '@/types';
import { Calendar } from 'lucide-react';
import { ComparacaoDiaTable as ComparacaoDiaTableContent } from './components/ComparacaoDiaTable';
import { SaasPanel } from '@/components/views/shared/SaasPrimitives';
import { ComparacaoPanelHeader } from './ComparacaoSectionWrapper';

interface ComparacaoDiaTableProps {
    dadosComparacao: DashboardResumoData[];
    semanasSelecionadas: (number | string)[];
}

export const ComparacaoDiaTable = React.memo<ComparacaoDiaTableProps>(({
    dadosComparacao,
    semanasSelecionadas,
}) => {
    const semanasSelecionadasText = React.useMemo(
        () => semanasSelecionadas.map((semana) => String(semana)),
        [semanasSelecionadas]
    );

    return (
        <SaasPanel className="rounded-xl border-[#d8e4eb] shadow-[0_8px_28px_-24px_rgba(15,57,82,0.5)] dark:border-slate-800">
            <ComparacaoPanelHeader
                title="Comparativo diário"
                description="Aderência diária nas semanas selecionadas."
                icon={Calendar}
            />
            <ComparacaoDiaTableContent
                semanasSelecionadas={semanasSelecionadasText}
                dadosComparacao={dadosComparacao}
            />
        </SaasPanel>
    );
});

ComparacaoDiaTable.displayName = 'ComparacaoDiaTable';
