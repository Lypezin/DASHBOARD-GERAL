import React from 'react';
import CustoPorLiberadoCard from '@/components/CustoPorLiberadoCard';
import { ValoresCidadePorCidade } from '@/types';
import { BarChart3 } from 'lucide-react';
import { SaasPanel } from '@/components/views/shared/SaasPrimitives';

interface CityCostGridProps {
    cidadesData: ValoresCidadePorCidade[];
}

export const CityCostGrid: React.FC<CityCostGridProps> = ({ cidadesData }) => {
    return (
        <section aria-labelledby="custo-por-liberado-title" className="space-y-3">
            <div className="flex items-end justify-between gap-3 px-0.5">
                <div>
                    <h2 id="custo-por-liberado-title" className="text-[15px] font-semibold tracking-tight text-[#183f58] dark:text-slate-100">
                        Custo por liberado
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Eficiência do investimento em cada praça
                    </p>
                </div>
                <BarChart3 className="mb-0.5 hidden h-4 w-4 text-muted-foreground sm:block" aria-hidden="true" />
            </div>

            {cidadesData.length === 0 ? (
                <SaasPanel className="px-5 py-10 text-center">
                    <BarChart3 className="mx-auto h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    <p className="mt-3 text-sm font-medium text-muted-foreground">
                        Nenhum dado encontrado para o período selecionado.
                    </p>
                </SaasPanel>
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
        </section>
    );
};
