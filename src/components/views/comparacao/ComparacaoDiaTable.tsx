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
    <div className="glass-card rounded-2xl border-white/20 dark:border-slate-800/60 shadow-xl shadow-indigo-100/20 dark:shadow-slate-900/50 overflow-hidden transition-all duration-300">
      <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50">
        <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-1.5 h-6 rounded-full bg-blue-500/80"></span>
            Comparativo Diário
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
