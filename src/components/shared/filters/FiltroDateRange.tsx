import React from 'react';
import { DateRangeInputs } from '@/components/date-range/DateRangeInputs';
import { DateRangeActions } from '@/components/date-range/DateRangeActions';
import { useDateRangeLogic } from '@/components/date-range/useDateRangeLogic';

interface FiltroDateRangeProps {
  appearance?: 'default' | 'quiet';
  dataInicial: string | null;
  dataFinal: string | null;
  onRangeApply: (dataInicial: string | null, dataFinal: string | null) => void;
  onRangeClear?: () => void;
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
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end" data-filter-role="range">
      <DateRangeInputs
        tempDataInicial={tempDataInicial}
        tempDataFinal={tempDataFinal}
        onChangeDataInicial={handleDataInicialChange}
        onChangeDataFinal={handleDataFinalChange}
        minDate={dataMinima}
        maxDate={hoje}
        appearance={props.appearance}
      />

      <DateRangeActions
        onApply={handleAplicar}
        onClear={handleLimpar}
        canApply={temAlteracao}
        hasFilter={!!temFiltro}
        appearance={props.appearance}
      />
    </div>
  );
};

export default FiltroDateRange;
