import React from 'react';
import { DateRangeInputs } from './date-range/DateRangeInputs';
import { DateRangeActions } from './date-range/DateRangeActions';
import { useDateRangeLogic } from './date-range/useDateRangeLogic';

interface FiltroDateRangeProps {
  dataInicial: string | null;
  dataFinal: string | null;
  onDataInicialChange: (data: string | null) => void;
  onDataFinalChange: (data: string | null) => void;
  onApply?: () => void;
}

const FiltroDateRange: React.FC<FiltroDateRangeProps> = (props) => {
  const {
    tempDataInicial,
    tempDataFinal,
    handleDataInicialChange,
    handleDataFinalChange,
    handleAplicar,
    handleLimpar,
    temAlteracao,
    temFiltro,
  } = useDateRangeLogic(props);

  const hoje = new Date().toISOString().split('T')[0];
  const dataMinima = '2020-01-01';

  return (
    <div className="flex items-end gap-3">
      <DateRangeInputs
        tempDataInicial={tempDataInicial}
        tempDataFinal={tempDataFinal}
        onChangeDataInicial={handleDataInicialChange}
        onChangeDataFinal={handleDataFinalChange}
        minDate={dataMinima}
        maxDate={hoje}
      />

      <DateRangeActions
        onApply={handleAplicar}
        onClear={handleLimpar}
        canApply={temAlteracao}
        hasFilter={!!temFiltro}
      />
    </div>
  );
};

export default FiltroDateRange;
