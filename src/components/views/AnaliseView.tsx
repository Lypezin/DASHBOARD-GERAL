import React, { useState, useCallback } from 'react';
import { Totals, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnaliseTable } from '../analise/AnaliseTable';
import { AnaliseTableTabs } from '../analise/AnaliseTableTabs';
import { useAnaliseTaxas } from '@/hooks/analise/useAnaliseTaxas';
import { ListChecks } from 'lucide-react';
import { useAnaliseTableData } from '@/hooks/analise/useAnaliseTableData';
import { AnaliseMetricCards } from './analise/components/AnaliseMetricCards';

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

  // Hook para dados da tabela (refatorado)
  const { tableData, labelColumn } = useAnaliseTableData(
    activeTable,
    aderenciaDia,
    aderenciaTurno,
    aderenciaSubPraca,
    aderenciaOrigem
  );

  const handleTableChange = useCallback((table: TableType) => setActiveTable(table), []);

  return (
    <div className="space-y-6 animate-fade-in">
      <AnaliseMetricCards
        totals={totals}
        taxaAceitacao={taxaAceitacao}
        taxaCompletude={taxaCompletude}
        taxaRejeicao={taxaRejeicao}
      />

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
