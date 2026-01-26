import React from 'react';
import CustoPorLiberadoCard from '@/components/CustoPorLiberadoCard';
import { ValoresCidadePorCidade } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, DollarSign, Building2, MapPin } from 'lucide-react';

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

  const SummaryCard = ({
    title,
    value,
    subtext,
    icon: Icon,
    colorClass,
    bgClass,
    iconBgClass
  }: {
    title: string;
    value: string;
    subtext: string;
    icon: any;
    colorClass: string;
    bgClass: string;
    iconBgClass: string
  }) => (
    <Card className="border-none shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden relative bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${bgClass} opacity-10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-500`} />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
        <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${iconBgClass} transition-colors duration-300 group-hover:bg-opacity-80`}>
          <Icon className={`h-4 w-4 ${colorClass}`} />
        </div>
      </CardHeader>
      <CardContent className="z-10 relative">
        <div className={`text-3xl font-bold tracking-tight ${colorClass} mb-2`}>
          {value}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium opacity-80">
          {subtext}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cartões Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Geral"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalGeral)}
          subtext="Valor total acumulado"
          icon={DollarSign}
          colorClass="text-emerald-600 dark:text-emerald-400"
          bgClass="from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-900"
          iconBgClass="bg-emerald-100 dark:bg-emerald-900/40"
        />

        <SummaryCard
          title="Custo por Liberado"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(custoPorLiberado)}
          subtext="Média geral"
          icon={BarChart3}
          colorClass="text-purple-600 dark:text-purple-400"
          bgClass="from-purple-50 to-white dark:from-purple-900/20 dark:to-slate-900"
          iconBgClass="bg-purple-100 dark:bg-purple-900/40"
        />
      </div>

      {/* Cartões de Cidade */}
      <div className="space-y-8">
        {/* Valores por Cidade */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-1.5 rounded-full bg-gradient-to-b from-blue-500 to-cyan-600 shadow-sm" />
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Valores por Cidade
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Detalhamento financeiro por praça
              </p>
            </div>
          </div>

          {cidadesData.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900/50">
              <div className="mx-auto h-12 w-12 text-slate-300 mb-3">
                <Building2 className="h-full w-full" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Nenhum dado encontrado para o período selecionado.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cidadesData.map((cidadeData) => (
                <Card
                  key={cidadeData.cidade}
                  className="border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800 group overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 opacity-40 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-110 duration-500" />

                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative border-b border-slate-100 dark:border-slate-800/50 mb-3">
                    <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate flex items-center gap-2" title={cidadeData.cidade}>
                      <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                        <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="uppercase tracking-wide text-slate-600 dark:text-slate-300">{cidadeData.cidade}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="z-10 relative">
                    <div className="space-y-1">
                      <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Valor Total</span>
                      <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cidadeData.valor_total)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Custo por Liberado por Cidade */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-1.5 rounded-full bg-gradient-to-b from-purple-500 to-pink-600 shadow-sm" />
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Custo por Liberado por Cidade
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Eficiência de investimento por praça
              </p>
            </div>
          </div>

          {cidadesData.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900/50">
              <div className="mx-auto h-12 w-12 text-slate-300 mb-3">
                <BarChart3 className="h-full w-full" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
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
    </div>
  );
};

