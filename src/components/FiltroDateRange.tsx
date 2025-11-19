import React, { useCallback, useEffect } from 'react';
import { safeLog } from '@/lib/errorHandler';

interface FiltroDateRangeProps {
  dataInicial: string | null;
  dataFinal: string | null;
  onDataInicialChange: (data: string | null) => void;
  onDataFinalChange: (data: string | null) => void;
}

const FiltroDateRange: React.FC<FiltroDateRangeProps> = ({
  dataInicial,
  dataFinal,
  onDataInicialChange,
  onDataFinalChange,
}) => {
  // Log para debug
  useEffect(() => {
    safeLog.info('[FiltroDateRange] Props recebidas:', {
      dataInicial,
      dataFinal,
      dataInicialType: typeof dataInicial,
      dataFinalType: typeof dataFinal,
    });
  }, [dataInicial, dataFinal]);
  const handleDataInicialChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const value = e.target.value || null;
      safeLog.info('[FiltroDateRange] Data inicial alterada:', { value, dataFinal });
      onDataInicialChange(value);
      
      // Se data inicial for maior que data final, ajustar data final
      if (value && dataFinal && value > dataFinal) {
        safeLog.info('[FiltroDateRange] Ajustando data final para:', value);
        onDataFinalChange(value);
      }
    } catch (error) {
      safeLog.error('[FiltroDateRange] Erro em handleDataInicialChange:', error);
    }
  }, [dataFinal, onDataInicialChange, onDataFinalChange]);

  const handleDataFinalChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const value = e.target.value || null;
      safeLog.info('[FiltroDateRange] Data final alterada:', { value, dataInicial });
      
      // Validar que data final >= data inicial
      if (value && dataInicial && value < dataInicial) {
        // Se data final for menor que inicial, ajustar para igual
        safeLog.info('[FiltroDateRange] Ajustando data final para data inicial:', dataInicial);
        onDataFinalChange(dataInicial);
      } else {
        onDataFinalChange(value);
      }
    } catch (error) {
      safeLog.error('[FiltroDateRange] Erro em handleDataFinalChange:', error);
    }
  }, [dataInicial, onDataFinalChange]);

  // Calcular data mínima e máxima permitidas
  const hoje = new Date().toISOString().split('T')[0];
  const dataMinima = '2020-01-01'; // Data mínima razoável

  return (
    <div className="flex gap-3">
      <div className="space-y-1 flex-shrink-0">
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
          Data Inicial
        </label>
        <input
          type="date"
          value={dataInicial || ''}
          onChange={handleDataInicialChange}
          min={dataMinima}
          max={hoje}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400 min-w-[140px]"
        />
      </div>
      <div className="space-y-1 flex-shrink-0">
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
          Data Final
        </label>
        <input
          type="date"
          value={dataFinal || ''}
          onChange={handleDataFinalChange}
          min={dataInicial || dataMinima}
          max={hoje}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400 min-w-[140px]"
        />
      </div>
    </div>
  );
};

export default FiltroDateRange;

