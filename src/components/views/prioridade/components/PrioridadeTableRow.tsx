import React from 'react';
import { Entregador } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
    calcularPercentualAceitas,
    calcularPercentualCompletadas,
    getAderenciaColor,
    getAderenciaBg,
    getRejeicaoColor,
    getRejeicaoBg,
    getAceitasColor,
    getAceitasBg,
    getCompletadasColor,
    getCompletadasBg,
} from '../PrioridadeUtils';

interface PrioridadeTableRowProps {
    entregador: Entregador;
}

export const PrioridadeTableRow = React.memo<PrioridadeTableRowProps>(({
    entregador,
}) => {
    const percentualAceitas = calcularPercentualAceitas(entregador);
    const percentualCompletadas = calcularPercentualCompletadas(entregador);

    return (
        <tr className="transition-all hover:shadow-[inset_4px_0_0_#2563eb] hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white leading-normal pr-4">{entregador.nome_entregador}</td>
            <td className="px-6 py-4 text-center text-slate-650 dark:text-slate-400 font-mono tracking-tight font-bold whitespace-nowrap">{entregador.corridas_ofertadas.toLocaleString('pt-BR')}</td>
            <td className="px-6 py-4 text-center text-emerald-600 dark:text-emerald-450 font-mono tracking-tight font-bold whitespace-nowrap">{entregador.corridas_aceitas.toLocaleString('pt-BR')}</td>
            <td className="px-6 py-4 text-center text-rose-600 dark:text-rose-450 font-mono tracking-tight font-bold whitespace-nowrap">{entregador.corridas_rejeitadas.toLocaleString('pt-BR')}</td>
            <td className="px-6 py-4 text-center">
                <Badge variant="outline" className={`font-mono font-bold ${getAceitasBg(percentualAceitas)} ${getAceitasColor(percentualAceitas)} whitespace-nowrap rounded-lg px-2 py-0.5`}>
                    {percentualAceitas.toFixed(1)}%
                </Badge>
            </td>
            <td className="px-6 py-4 text-center text-blue-600 dark:text-blue-400 font-mono tracking-tight font-bold whitespace-nowrap">{entregador.corridas_completadas.toLocaleString('pt-BR')}</td>
            <td className="px-6 py-4 text-center">
                <Badge variant="outline" className={`font-mono font-bold ${getCompletadasBg(percentualCompletadas)} ${getCompletadasColor(percentualCompletadas)} whitespace-nowrap rounded-lg px-2 py-0.5`}>
                    {percentualCompletadas.toFixed(1)}%
                </Badge>
            </td>
            <td className="px-6 py-4 text-center">
                <Badge variant="outline" className={`font-mono font-extrabold ${getAderenciaBg(entregador.aderencia_percentual ?? 0)} ${getAderenciaColor(entregador.aderencia_percentual ?? 0)} whitespace-nowrap rounded-lg px-2 py-0.5`}>
                    {(entregador.aderencia_percentual ?? 0).toFixed(1)}%
                </Badge>
            </td>
            <td className="px-6 py-4 text-center">
                <Badge variant="outline" className={`font-mono font-extrabold ${getRejeicaoBg(entregador.rejeicao_percentual ?? 0)} ${getRejeicaoColor(entregador.rejeicao_percentual ?? 0)} whitespace-nowrap rounded-lg px-2 py-0.5`}>
                    {(entregador.rejeicao_percentual ?? 0).toFixed(1)}%
                </Badge>
            </td>
        </tr>
    );
});

PrioridadeTableRow.displayName = 'PrioridadeTableRow';
