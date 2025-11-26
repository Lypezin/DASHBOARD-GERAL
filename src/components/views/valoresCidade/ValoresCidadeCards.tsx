import React from 'react';
import CustoPorLiberadoCard from '@/components/CustoPorLiberadoCard';
import { ValoresCidadePorCidade } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, DollarSign, Building2 } from 'lucide-react';

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
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Geral</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalGeral)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor total acumulado
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Custo por Liberado</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(custoPorLiberado)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Média geral
            </p>
          </CardContent>
        </Card>
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
                <Card key={cidadeData.cidade} className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate" title={cidadeData.cidade}>
                      {cidadeData.cidade}
                    </CardTitle>
                    <Building2 className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cidadeData.valor_total)}
                    </div>
                  </CardContent>
                </Card>
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

