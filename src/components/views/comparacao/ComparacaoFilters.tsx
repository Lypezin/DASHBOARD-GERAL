import React from 'react';
import { FilterOption } from '@/types';
import FiltroSelect from '@/components/FiltroSelect';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Search, Info, AlertCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ComparacaoFiltersProps {
  pracas: FilterOption[];
  todasSemanas: (number | string)[];
  semanasSelecionadas: string[];
  pracaSelecionada: string | null;
  shouldDisablePracaFilter: boolean;
  onPracaChange: (praca: string | null) => void;
  onToggleSemana: (semana: number | string) => void;
  onClearSemanas: () => void;
  onComparar: () => void;
  onMostrarApresentacao: () => void;
  loading: boolean;
  dadosComparacaoLength: number;
}

export const ComparacaoFilters: React.FC<ComparacaoFiltersProps> = ({
  pracas,
  todasSemanas,
  semanasSelecionadas,
  pracaSelecionada,
  shouldDisablePracaFilter,
  onPracaChange,
  onToggleSemana,
  onClearSemanas,
  onComparar,
  onMostrarApresentacao,
  loading,
  dadosComparacaoLength,
}) => {
  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
      <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-slate-500" />
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Configurar Comparação</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Selecione a praça e as semanas para análise comparativa detalhada
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Tutorial/Instruções para Apresentação */}
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-900/50 dark:bg-purple-900/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <Info className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-3">
              <div>
                <h4 className="font-medium text-purple-900 dark:text-purple-300">Como Gerar a Apresentação em PDF</h4>
                <div className="mt-2 rounded-md bg-amber-50 border border-amber-200 p-2 text-xs text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200 flex items-center gap-2">
                  <AlertCircle className="h-3 w-3" />
                  <strong>Em Desenvolvimento:</strong> A função de Apresentação está em desenvolvimento e será disponibilizada em breve.
                </div>
              </div>

              <ol className="space-y-2 text-sm text-purple-800 dark:text-purple-300/80">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600 dark:text-purple-400">1.</span>
                  <span>Selecione <strong>exatamente 2 semanas</strong> usando os checkboxes abaixo.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600 dark:text-purple-400">2.</span>
                  <span>Clique em <strong>&quot;Comparar Semanas&quot;</strong> para carregar os dados.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600 dark:text-purple-400">3.</span>
                  <span>Clique em <strong>&quot;Apresentação&quot;</strong> para visualizar e gerar o PDF.</span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Filtro de Praça */}
        <div className="max-w-md">
          <FiltroSelect
            label="Praça"
            value={pracaSelecionada ?? ''}
            options={pracas}
            placeholder="Todas"
            onChange={(value) => onPracaChange(value)}
            disabled={shouldDisablePracaFilter}
          />
        </div>

        {/* Seleção de Semanas */}
        <div className="flex flex-col space-y-3">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Semanas (selecione 2 ou mais)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 px-4 w-full sm:w-[280px] justify-between border-slate-200 dark:border-slate-800">
                  <span className="truncate">
                    {semanasSelecionadas.length > 0
                      ? `${semanasSelecionadas.length} semanas selecionadas`
                      : "Selecionar semanas..."}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[280px] max-h-[300px] overflow-y-auto" align="start">
                <DropdownMenuLabel>Semanas Disponíveis</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {todasSemanas.map((semana) => {
                  const semanaStr = String(semana);
                  const semanaNumStr = semanaStr.includes('W') ? (semanaStr.match(/W(\d+)/)?.[1] || semanaStr) : semanaStr;
                  const isSelected = semanasSelecionadas.includes(semanaNumStr);

                  return (
                    <DropdownMenuCheckboxItem
                      key={semanaStr}
                      checked={isSelected}
                      onCheckedChange={() => onToggleSemana(semana)}
                    >
                      Semana {semanaNumStr}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Selected Tags Display */}
            <div className="flex flex-wrap gap-2">
              {semanasSelecionadas.slice(0, 5).map((semana) => (
                <div key={semana} className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:border-blue-800 dark:bg-blue-900/10 dark:text-blue-400">
                  S{semana}
                </div>
              ))}
              {semanasSelecionadas.length > 5 && (
                <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                  +{semanasSelecionadas.length - 5}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {semanasSelecionadas.length > 0 && (
              <span>
                {semanasSelecionadas.length} semana{semanasSelecionadas.length !== 1 ? 's' : ''} selecionada{semanasSelecionadas.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {semanasSelecionadas.length > 0 && (
              <button
                onClick={onClearSemanas}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
              >
                Limpar seleção
              </button>
            )}
            <button
              onClick={onComparar}
              disabled={semanasSelecionadas.length < 2 || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? 'Comparando...' : 'Comparar Semanas'}
            </button>

            <button
              onClick={onMostrarApresentacao}
              disabled={semanasSelecionadas.length !== 2 || dadosComparacaoLength !== 2}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title={semanasSelecionadas.length !== 2 ? 'Selecione exatamente 2 semanas para gerar a apresentação' : 'Gerar apresentação em PDF'}
            >
              Apresentação
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
