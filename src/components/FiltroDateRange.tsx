import React, { useCallback } from 'react';

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
  const handleDataInicialChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value || null;
    onDataInicialChange(value);
    
    // Se data inicial for maior que data final, ajustar data final
    if (value && dataFinal && value > dataFinal) {
      onDataFinalChange(value);
    }
  }, [dataFinal, onDataInicialChange, onDataFinalChange]);

  const handleDataFinalChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value || null;
    
    // Validar que data final >= data inicial
    if (value && dataInicial && value < dataInicial) {
      // Se data final for menor que inicial, ajustar para igual
      onDataFinalChange(dataInicial);
    } else {
      onDataFinalChange(value);
    }
  }, [dataInicial, onDataFinalChange]);

  // Calcular data mínima e máxima permitidas
  const hoje = new Date().toISOString().split('T')[0];
  const dataMinima = '2020-01-01'; // Data mínima razoável

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
      <div className="space-y-1">
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
          Data Inicial
        </label>
        <input
          type="date"
          value={dataInicial || ''}
          onChange={handleDataInicialChange}
          min={dataMinima}
          max={hoje}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
          Data Final
        </label>
        <input
          type="date"
          value={dataFinal || ''}
          onChange={handleDataFinalChange}
          min={dataInicial || dataMinima}
          max={hoje}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
        />
      </div>
    </div>
  );
};

export default FiltroDateRange;

