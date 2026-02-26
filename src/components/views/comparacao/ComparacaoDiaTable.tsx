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
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Comparativo Diário</h3>
      </div>
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
    </div>
  );
});

ComparacaoDiaTable.displayName = 'ComparacaoDiaTable';
