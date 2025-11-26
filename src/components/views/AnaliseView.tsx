import React, { useState, useMemo, useCallback } from 'react';
import { Totals, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';
import MetricCard from '../MetricCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnaliseTable } from '../analise/AnaliseTable';
import { AnaliseTableTabs } from '../analise/AnaliseTableTabs';
import { useAnaliseTaxas } from '@/hooks/analise/useAnaliseTaxas';

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
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <MetricCard title="Ofertadas" value={totals.ofertadas} icon="📢" color="blue" />
        <MetricCard title="Aceitas" value={totals.aceitas} icon="✅" percentage={taxaAceitacao} percentageLabel="de aceitação" color="green" />
        <MetricCard title="Rejeitadas" value={totals.rejeitadas} icon="❌" percentage={taxaRejeicao} percentageLabel="de rejeição" color="red" />
        <MetricCard title="Completadas" value={totals.completadas} icon="🏁" percentage={taxaCompletude} percentageLabel="de completude" color="blue" />
      </div>

      {/* Análise Detalhada - Tabelas */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <Card className="relative border-0 shadow-xl bg-gradient-to-br from-white via-white to-blue-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/10 rounded-3xl overflow-hidden">
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-500/5 to-blue-400/5 rounded-full blur-3xl"></div>

          <CardHeader className="relative pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                    Análise Detalhada por Segmento
                  </CardTitle>
                  <CardDescription className="text-base mt-1 text-slate-600 dark:text-slate-400">Métricas completas de performance</CardDescription>
                </div>
              </div>
              <AnaliseTableTabs
                activeTable={activeTable}
                onTableChange={handleTableChange}
              />
            </div>
          </CardHeader>

          <CardContent className="relative">
            <AnaliseTable
              data={tableData}
              labelColumn={labelColumn}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

AnaliseView.displayName = 'AnaliseView';

export default AnaliseView;
