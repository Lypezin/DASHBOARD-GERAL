import React from 'react';
import { DashboardResumoData } from '@/types';
import { Table, TableBody } from '@/components/ui/table';
import { ComparacaoDiaHeader } from './components/ComparacaoDiaHeader';
import { ComparacaoDiaGroup } from './components/ComparacaoDiaGroup';

interface ComparacaoDiaTableProps {
  dadosComparacao: DashboardResumoData[];
  semanasSelecionadas: (number | string)[];
}

export const ComparacaoDiaTable = React.memo<ComparacaoDiaTableProps>(({
  dadosComparacao,
  semanasSelecionadas,
}) => {
  const diasSemana = [
    'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
  ];

  return (
    <div className="overflow-x-auto">
      <Table>
        <ComparacaoDiaHeader semanasSelecionadas={semanasSelecionadas} />
        <TableBody>
          {diasSemana.map((dia, diaIdx) => (
            <ComparacaoDiaGroup
              key={dia}
              dia={dia}
              diaIdx={diaIdx}
              semanasSelecionadas={semanasSelecionadas}
              dadosComparacao={dadosComparacao}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

ComparacaoDiaTable.displayName = 'ComparacaoDiaTable';
