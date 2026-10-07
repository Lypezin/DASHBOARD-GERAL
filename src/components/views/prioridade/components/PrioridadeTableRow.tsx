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
        <tr className="transition-colors duration-150 hover:bg-[#f6f9fb] dark:hover:bg-slate-900/60">
            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white leading-normal pr-4">{entregador.nome_entregador}</td>
            <td className="whitespace-nowrap px-3 py-4 text-center font-mono font-medium tabular-nums text-slate-700 dark:text-slate-300 sm:px-4">{entregador.corridas_ofertadas.toLocaleString('pt-BR')}</td>
            <td className="whitespace-nowrap px-3 py-4 text-center font-mono font-medium tabular-nums text-emerald-700 dark:text-emerald-300 sm:px-4">{entregador.corridas_aceitas.toLocaleString('pt-BR')}</td>
            <td className="whitespace-nowrap px-3 py-4 text-center font-mono font-medium tabular-nums text-rose-700 dark:text-rose-300 sm:px-4">{entregador.corridas_rejeitadas.toLocaleString('pt-BR')}</td>
            <td className="px-6 py-4 text-center">
                <Badge variant="outline" className={`font-mono font-bold ${getAceitasBg(percentualAceitas)} ${getAceitasColor(percentualAceitas)} whitespace-nowrap rounded-lg px-2 py-0.5`}>
                    {percentualAceitas.toFixed(1)}%
                </Badge>
            </td>
            <td className="whitespace-nowrap px-3 py-4 text-center font-mono font-medium tabular-nums text-[#285d79] dark:text-sky-200 sm:px-4">{entregador.corridas_completadas.toLocaleString('pt-BR')}</td>
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
