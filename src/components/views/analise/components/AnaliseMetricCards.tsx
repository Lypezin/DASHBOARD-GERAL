import React from 'react';
import { Megaphone, CheckCircle2, XCircle, Flag, Clock } from 'lucide-react';
import { Totals } from '@/types';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { AnaliseHeroCard } from './AnaliseHeroCard';

interface AnaliseMetricCardsProps {
    totals: Totals;
    taxaAceitacao: number;
    taxaCompletude: number;
    taxaRejeicao: number;
    totalHorasEntregues: number;
}

export const AnaliseMetricCards: React.FC<AnaliseMetricCardsProps> = ({ totals, taxaAceitacao, taxaCompletude, taxaRejeicao, totalHorasEntregues }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <AnaliseHeroCard title="Horas Entregues" icon={Clock} value={formatarHorasParaHMS(totalHorasEntregues)} accentColor="orange" />
            <AnaliseHeroCard title="Ofertadas" icon={Megaphone} value={totals.ofertadas.toLocaleString('pt-BR')} accentColor="blue" />
            <AnaliseHeroCard title="Aceitas" icon={CheckCircle2} value={totals.aceitas.toLocaleString('pt-BR')} accentColor="emerald" progress={{ value: taxaAceitacao, label: 'TAXA DE ACEITAÇÃO' }} />
            <AnaliseHeroCard title="Rejeitadas" icon={XCircle} value={totals.rejeitadas.toLocaleString('pt-BR')} accentColor="rose" progress={{ value: taxaRejeicao, label: 'TAXA DE REJEIÇÃO' }} />
            <AnaliseHeroCard title="Completadas" icon={Flag} value={totals.completadas.toLocaleString('pt-BR')} accentColor="violet" progress={{ value: taxaCompletude, label: 'TAXA DE COMPLETUDE' }} />
        </div>
    );
};
