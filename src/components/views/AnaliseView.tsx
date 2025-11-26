import React, { useState, useMemo, useCallback } from 'react';
import { Totals, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnaliseTable } from '../analise/AnaliseTable';
import { AnaliseTableTabs } from '../analise/AnaliseTableTabs';
import { useAnaliseTaxas } from '@/hooks/analise/useAnaliseTaxas';
import {
  Megaphone,
  CheckCircle2,
  XCircle,
  Flag,
  ListChecks,
  BarChart3
} from 'lucide-react';

type TableType = 'dia' | 'turno' | 'sub_praca' | 'origem';

const AnaliseView = React.memo(function AnaliseView({
  totals,
  aderenciaDia,
  aderenciaTurno,
  aderenciaSubPraca,
  aderenciaOrigem,
}: {
  totals: Totals;
  aderenciaDia: AderenciaDia[];
  aderenciaTurno: AderenciaTurno[];
  aderenciaSubPraca: AderenciaSubPraca[];
  aderenciaOrigem: AderenciaOrigem[];
}) {
  const [activeTable, setActiveTable] = useState<TableType>('dia');

  // Memoizar cálculos de taxas
  const { taxaAceitacao, taxaCompletude, taxaRejeicao } = useAnaliseTaxas(totals);

  // Memoizar handlers
  const handleTableChange = useCallback((table: TableType) => {
    setActiveTable(table);
  }, []);

  // Preparar dados para as tabelas
  const tableData = useMemo(() => {
    const diasDaSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    switch (activeTable) {
      case 'dia':
        return aderenciaDia.map(item => {
          // Calcular dia da semana a partir da data
          const dataObj = new Date(item.data + 'T00:00:00');
          const diaDaSemana = diasDaSemana[dataObj.getDay()];

          return {
            ...item,
            label: diaDaSemana,
          };
        });
      case 'turno':
        return aderenciaTurno.map(item => ({
          ...item,
          label: item.turno,
        }));
      case 'sub_praca':
        return aderenciaSubPraca.map(item => ({
          ...item,
          label: item.sub_praca,
        }));
      case 'origem':
        return aderenciaOrigem.map(item => ({
          ...item,
          label: item.origem,
        }));
      default:
        return [];
    }
  }, [activeTable, aderenciaDia, aderenciaTurno, aderenciaSubPraca, aderenciaOrigem]);

  const labelColumn = useMemo(() => {
    switch (activeTable) {
      case 'dia':
        return 'Dia';
      case 'turno':
        return 'Turno';
      case 'sub_praca':
        return 'Sub Praça';
      case 'origem':
        return 'Origem';
      default:
        return '';
    }
  }, [activeTable]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ofertadas */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ofertadas</CardTitle>
            <Megaphone className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {totals.ofertadas.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de corridas ofertadas
            </p>
          </CardContent>
        </Card>

        {/* Aceitas */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aceitas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {totals.aceitas.toLocaleString('pt-BR')}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${taxaAceitacao}%` }}></div>
              </div>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{taxaAceitacao.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Rejeitadas */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejeitadas</CardTitle>
            <XCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {totals.rejeitadas.toLocaleString('pt-BR')}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${taxaRejeicao}%` }}></div>
              </div>
              <span className="text-xs font-medium text-rose-600 dark:text-rose-400">{taxaRejeicao.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Completadas */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completadas</CardTitle>
            <Flag className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {totals.completadas.toLocaleString('pt-BR')}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${taxaCompletude}%` }}></div>
              </div>
              <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{taxaCompletude.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análise Detalhada - Tabelas */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <ListChecks className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                  Análise Detalhada
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400">
                  Métricas completas de performance por segmento
                </CardDescription>
              </div>
            </div>
            <AnaliseTableTabs
              activeTable={activeTable}
              onTableChange={handleTableChange}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <AnaliseTable
            data={tableData}
            labelColumn={labelColumn}
          />
        </CardContent>
      </Card>
    </div>
  );
});

AnaliseView.displayName = 'AnaliseView';

export default AnaliseView;
