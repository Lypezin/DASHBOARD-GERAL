import React from 'react';
import { DashboardResumoData } from '@/types';
import { Table, TableBody } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { ComparacaoDiaHeader } from './components/ComparacaoDiaHeader';
import { ComparacaoDiaGroup } from './components/ComparacaoDiaGroup';

interface ComparacaoDiaTableProps {
  dadosComparacao: DashboardResumoData[];
  semanasSelecionadas: (number | string)[];
}

export const ComparacaoDiaTable: React.FC<ComparacaoDiaTableProps> = ({
  dadosComparacao,
  semanasSelecionadas,
}) => {
  const diasSemana = [
    'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
  ];

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          <div>
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
              Detalhamento Diário
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Comparativo de aderência dia a dia entre as semanas selecionadas
            </CardDescription>
          </div>
        </div>
      </CardHeader>
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
};
