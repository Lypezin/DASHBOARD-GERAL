import React from 'react';
import { DashboardResumoData } from '@/types';
import { Calendar } from 'lucide-react';
import { ComparacaoDiaTable as ComparacaoDiaTableContent } from './components/ComparacaoDiaTable';
import { SaasPanel, SaasPanelHeader } from '@/components/views/shared/SaasPrimitives';

interface ComparacaoDiaTableProps {
    dadosComparacao: DashboardResumoData[];
    semanasSelecionadas: (number | string)[];
}

export const ComparacaoDiaTable = React.memo<ComparacaoDiaTableProps>(({
    dadosComparacao,
    semanasSelecionadas,
}) => {
    return (
        <SaasPanel>
            <SaasPanelHeader
                eyebrow="Dias"
                title="Comparativo diario"
                description="Leitura compacta de aderencia por dia entre as semanas."
                icon={Calendar}
            />
            <ComparacaoDiaTableContent
                semanasSelecionadas={semanasSelecionadas.map((semana) => String(semana))}
                dadosComparacao={dadosComparacao}
            />
        </SaasPanel>
    );
});

ComparacaoDiaTable.displayName = 'ComparacaoDiaTable';
