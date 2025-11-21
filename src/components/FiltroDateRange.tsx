import React, { useCallback, useEffect, useState } from 'react';
import { safeLog } from '@/lib/errorHandler';

interface FiltroDateRangeProps {
  dataInicial: string | null;
  dataFinal: string | null;
  onDataInicialChange: (data: string | null) => void;
  onDataFinalChange: (data: string | null) => void;
  onApply?: () => void; // Callback opcional quando filtro é aplicado
}

const FiltroDateRange: React.FC<FiltroDateRangeProps> = ({
  dataInicial,
  dataFinal,
  onDataInicialChange,
  onDataFinalChange,
  onApply,
}) => {
  // Estado temporário para valores não aplicados ainda
  const [tempDataInicial, setTempDataInicial] = useState<string>(dataInicial || '');
  const [tempDataFinal, setTempDataFinal] = useState<string>(dataFinal || '');

  // Sincronizar estado local quando filtro externo mudar
  useEffect(() => {
    setTempDataInicial(dataInicial || '');
    setTempDataFinal(dataFinal || '');
  }, [dataInicial, dataFinal]);

  const handleDataInicialChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const value = e.target.value || '';
      setTempDataInicial(value);
      
      // Se data inicial for maior que data final temporária, ajustar data final temporária
      if (value && tempDataFinal && value > tempDataFinal) {
        setTempDataFinal(value);
      }
    } catch (error) {
      safeLog.error('[FiltroDateRange] Erro em handleDataInicialChange:', error);
    }
  }, [tempDataFinal]);

  const handleDataFinalChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const value = e.target.value || '';
      setTempDataFinal(value);
      
      // Validar que data final >= data inicial temporária
      if (value && tempDataInicial && value < tempDataInicial) {
        // Se data final for menor que inicial, ajustar para igual
        setTempDataFinal(tempDataInicial);
      }
    } catch (error) {
      safeLog.error('[FiltroDateRange] Erro em handleDataFinalChange:', error);
    }
  }, [tempDataInicial]);

  const handleAplicar = useCallback(() => {
    // Validar datas antes de aplicar
    const dataIni = tempDataInicial || null;
    let dataFim = tempDataFinal || null;
    
    // Validar que data final >= data inicial
    if (dataIni && dataFim && dataFim < dataIni) {
      dataFim = dataIni;
      setTempDataFinal(dataIni);
    }
    
    onDataInicialChange(dataIni);
    onDataFinalChange(dataFim);
    
    safeLog.info('[FiltroDateRange] Filtro aplicado:', { dataIni, dataFim });
    
    // Chamar callback se fornecido
    if (onApply) {
      onApply();
    }
  }, [tempDataInicial, tempDataFinal, onDataInicialChange, onDataFinalChange, onApply]);

  const handleLimpar = useCallback(() => {
    setTempDataInicial('');
    setTempDataFinal('');
    onDataInicialChange(null);
    onDataFinalChange(null);
    safeLog.info('[FiltroDateRange] Filtro limpo');
  }, [onDataInicialChange, onDataFinalChange]);

  // Verificar se há alterações pendentes
  const temAlteracao = tempDataInicial !== (dataInicial || '') || tempDataFinal !== (dataFinal || '');
  const temFiltro = dataInicial || dataFinal;

  // Calcular data mínima e máxima permitidas
  const hoje = new Date().toISOString().split('T')[0];
  const dataMinima = '2020-01-01'; // Data mínima razoável

  return (
    <div className="flex items-end gap-3">
      <div className="flex gap-3">
        <div className="space-y-1 flex-shrink-0">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
            Data Inicial
          </label>
          <input
            type="date"
            value={tempDataInicial}
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
            value={tempDataFinal}
            onChange={handleDataFinalChange}
            min={tempDataInicial || dataMinima}
            max={hoje}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400 min-w-[140px]"
          />
        </div>
      </div>
      
      {/* Botões de ação */}
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={handleAplicar}
          disabled={!temAlteracao}
          className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:-translate-y-0.5 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-md disabled:hover:translate-y-0 h-[42px]"
          title={temAlteracao ? 'Aplicar filtro de datas' : 'Nenhuma alteração para aplicar'}
        >
          ✓ Aplicar
        </button>
        {temFiltro && (
          <button
            onClick={handleLimpar}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md hover:-translate-y-0.5 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 h-[42px]"
            title="Limpar filtro de datas"
          >
            ✕ Limpar
          </button>
        )}
      </div>
    </div>
  );
};

export default FiltroDateRange;

