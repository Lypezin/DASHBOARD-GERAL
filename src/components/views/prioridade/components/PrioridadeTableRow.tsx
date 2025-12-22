import React from 'react';
import { Entregador } from '@/types';
import { Badge } from '@/components/ui/badge';

interface PrioridadeTableRowProps {
    entregador: Entregador;
    calcularPercentualAceitas: (entregador: Entregador) => number;
    calcularPercentualCompletadas: (entregador: Entregador) => number;
    getAderenciaColor: (aderencia: number) => string;
    getAderenciaBg: (aderencia: number) => string;
    getRejeicaoColor: (rejeicao: number) => string;
    getRejeicaoBg: (rejeicao: number) => string;
    getAceitasColor: (percentual: number) => string;
    getAceitasBg: (percentual: number) => string;
    getCompletadasColor: (percentual: number) => string;
    getCompletadasBg: (percentual: number) => string;
}

export const PrioridadeTableRow: React.FC<PrioridadeTableRowProps> = ({
    entregador,
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
}) => {
    const percentualAceitas = calcularPercentualAceitas(entregador);
    const percentualCompletadas = calcularPercentualCompletadas(entregador);

    return (
        <tr className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{entregador.nome_entregador}</td>
            <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400 whitespace-nowrap">{entregador.corridas_ofertadas.toLocaleString('pt-BR')}</td>
            <td className="px-6 py-4 text-center text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{entregador.corridas_aceitas.toLocaleString('pt-BR')}</td>
            <td className="px-6 py-4 text-center text-rose-600 dark:text-rose-400 whitespace-nowrap">{entregador.corridas_rejeitadas.toLocaleString('pt-BR')}</td>
            <td className="px-6 py-4 text-center">
                <Badge variant="outline" className={`font-normal ${getAceitasBg(percentualAceitas)} ${getAceitasColor(percentualAceitas)} whitespace-nowrap`}>
                    {percentualAceitas.toFixed(1)}%
                </Badge>
            </td>
            <td className="px-6 py-4 text-center text-blue-600 dark:text-blue-400 whitespace-nowrap">{entregador.corridas_completadas.toLocaleString('pt-BR')}</td>
            <td className="px-6 py-4 text-center">
                <Badge variant="outline" className={`font-normal ${getCompletadasBg(percentualCompletadas)} ${getCompletadasColor(percentualCompletadas)} whitespace-nowrap`}>
                    {percentualCompletadas.toFixed(1)}%
                </Badge>
            </td>
            <td className="px-6 py-4 text-center">
                <Badge variant="outline" className={`font-medium ${getAderenciaBg(entregador.aderencia_percentual ?? 0)} ${getAderenciaColor(entregador.aderencia_percentual ?? 0)} whitespace-nowrap`}>
                    {(entregador.aderencia_percentual ?? 0).toFixed(1)}%
                </Badge>
            </td>
            <td className="px-6 py-4 text-center">
                <Badge variant="outline" className={`font-medium ${getRejeicaoBg(entregador.rejeicao_percentual ?? 0)} ${getRejeicaoColor(entregador.rejeicao_percentual ?? 0)} whitespace-nowrap`}>
                    {(entregador.rejeicao_percentual ?? 0).toFixed(1)}%
                </Badge>
            </td>
        </tr>
    );
};
