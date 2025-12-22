import React, { useState, useCallback } from 'react';
import { Totals, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnaliseTable } from '../analise/AnaliseTable';
import { AnaliseTableTabs } from '../analise/AnaliseTableTabs';
import { useAnaliseTaxas } from '@/hooks/analise/useAnaliseTaxas';
import { ListChecks } from 'lucide-react';
import { useAnaliseTableData } from '@/hooks/analise/useAnaliseTableData';
import { AnaliseMetricCards } from './analise/components/AnaliseMetricCards';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportarAnaliseParaExcel } from './analise/AnaliseExcelExport';
import { safeLog } from '@/lib/errorHandler';
import { motion, Variants } from 'framer-motion';

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
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true);
      await exportarAnaliseParaExcel(
        totals,
        aderenciaDia,
        aderenciaTurno,
        aderenciaSubPraca,
        aderenciaOrigem
      );
    } catch (error) {
      safeLog.error('Erro no export:', error);
      // Opcional: toast error
    } finally {
      setIsExporting(false);
    }
  }, [totals, aderenciaDia, aderenciaTurno, aderenciaSubPraca, aderenciaOrigem]);

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

  // Calcular total de horas (soma dos segundos realizados convertidos para horas)
  const totalHoras = React.useMemo(() => {
    return aderenciaDia.reduce((acc, curr) => acc + (curr.segundos_realizados || 0), 0) / 3600;
  }, [aderenciaDia]);

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div
      className="space-y-6 pb-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div className="flex justify-end" variants={item}>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isExporting}
          className="gap-2 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm transition-all hover:shadow-md"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Exportando...' : 'Exportar Excel'}
        </Button>
      </motion.div>

      <motion.div variants={item}>
        <AnaliseMetricCards
          totals={totals}
          taxaAceitacao={taxaAceitacao}
          taxaCompletude={taxaCompletude}
          taxaRejeicao={taxaRejeicao}
          totalHorasEntregues={totalHoras}
        />
      </motion.div>

      {/* Análise Detalhada - Tabelas */}
      <motion.div variants={item}>
        <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <ListChecks className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="bg-indigo-500 w-1.5 h-6 rounded-full inline-block"></span>
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
      </motion.div>
    </motion.div>
  );
});

AnaliseView.displayName = 'AnaliseView';

export default AnaliseView;
