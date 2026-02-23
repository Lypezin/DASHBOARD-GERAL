import React from 'react';
import { DashboardResumoData } from '@/types';
import { Table, TableBody } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
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
    <Card className="border-none shadow-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl ring-1 ring-slate-200/50 dark:ring-slate-800/50 overflow-hidden transition-all duration-300">
      <div className="flex flex-col gap-1 px-6 py-5 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-xl ring-1 ring-indigo-500/20 dark:ring-indigo-500/30">
            <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Detalhamento Diário
            </h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Performance de aderência dia a dia
            </p>
          </div>
        </div>
      </div>
      <CardContent className="p-0">
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
      </CardContent>
    </Card>
  );
});

ComparacaoDiaTable.displayName = 'ComparacaoDiaTable';
