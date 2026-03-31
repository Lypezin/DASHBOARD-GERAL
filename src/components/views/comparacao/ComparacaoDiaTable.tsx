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
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] overflow-hidden transition-all duration-300">
      <div className="flex items-center justify-between px-8 py-6 border-b border-transparent">
        <h3 className="text-lg text-slate-900 dark:text-white flex items-center gap-3">
            <span className="w-1 h-5 rounded-full bg-slate-200 dark:bg-slate-700"></span>
            <span className="font-semibold tracking-tight">Comparativo Diário</span>
        </h3>
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
