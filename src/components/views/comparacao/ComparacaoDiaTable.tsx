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
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="flex flex-col gap-1 px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Detalhamento Diário
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
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
