import React from 'react';
import CustoPorLiberadoCard from '@/components/CustoPorLiberadoCard';
import { ValoresCidadePorCidade } from '@/types';
import { BarChart3 } from 'lucide-react';

interface CityCostGridProps {
    cidadesData: ValoresCidadePorCidade[];
}

export const CityCostGrid: React.FC<CityCostGridProps> = ({ cidadesData }) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 px-2">
                <div className="h-8 w-1.5 rounded-full bg-gradient-to-b from-sky-500 to-blue-600 shadow-sm" />
                <div>
                    <h3 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                        Custo por Liberado por Cidade
                    </h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Eficiência de investimento por praça
                    </p>
                </div>
            </div>

            {cidadesData.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900/50">
                    <div className="mx-auto mb-3 h-12 w-12 text-slate-300">
                        <BarChart3 className="h-full w-full" />
                    </div>
                    <p className="font-medium text-slate-500 dark:text-slate-400">
                        Nenhum dado encontrado para o período selecionado.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {cidadesData.map((cidadeData) => (
                        <CustoPorLiberadoCard
                            key={`custo-${cidadeData.cidade}`}
                            cidade={cidadeData.cidade}
                            custoPorLiberado={cidadeData.custo_por_liberado || 0}
                            quantidadeLiberados={cidadeData.quantidade_liberados || 0}
                            valorTotalEnviados={cidadeData.valor_total_enviados || 0}
                            color="blue"
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
