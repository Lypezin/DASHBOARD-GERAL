import React from 'react';
import MarketingCard from '@/components/MarketingCard';
import CustoPorLiberadoCard from '@/components/CustoPorLiberadoCard';
import { ValoresCidadePorCidade } from '@/types';

interface ValoresCidadeCardsProps {
  totalGeral: number;
  custoPorLiberado: number;
  cidadesData: ValoresCidadePorCidade[];
}

export const ValoresCidadeCards: React.FC<ValoresCidadeCardsProps> = ({
  totalGeral,
  custoPorLiberado,
  cidadesData,
}) => {
  return (
    <>
      {/* Cartões Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MarketingCard
          title="Total Geral"
          value={totalGeral}
          icon="💰"
          color="green"
          formatCurrency={true}
        />
        <MarketingCard
          title="Custo por Liberado"
          value={custoPorLiberado}
          icon="📊"
          color="purple"
          formatCurrency={true}
        />
      </div>

      {/* Cartões de Cidade */}
      <div className="space-y-6">
        {/* Valores por Cidade */}
        <div>
          <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
            Valores por Cidade
          </h3>
          {cidadesData.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-slate-500 dark:text-slate-400">
                Nenhum dado encontrado para o período selecionado.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cidadesData.map((cidadeData) => (
                <MarketingCard
                  key={cidadeData.cidade}
                  title={cidadeData.cidade}
                  value={cidadeData.valor_total}
                  icon="🏙️"
                  color="blue"
                  formatCurrency={true}
                />
              ))}
            </div>
          )}
        </div>

        {/* Custo por Liberado por Cidade */}
        <div>
          <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
            Custo por Liberado por Cidade
          </h3>
          {cidadesData.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-slate-500 dark:text-slate-400">
                Nenhum dado encontrado para o período selecionado.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cidadesData.map((cidadeData) => (
                <CustoPorLiberadoCard
                  key={`custo-${cidadeData.cidade}`}
                  cidade={cidadeData.cidade}
                  custoPorLiberado={cidadeData.custo_por_liberado || 0}
                  quantidadeLiberados={cidadeData.quantidade_liberados || 0}
                  valorTotalEnviados={cidadeData.valor_total_enviados || 0}
                  color="purple"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

