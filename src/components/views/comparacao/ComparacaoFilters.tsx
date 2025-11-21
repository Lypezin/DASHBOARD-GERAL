import React from 'react';
import { FilterOption } from '@/types';
import FiltroSelect from '@/components/FiltroSelect';

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
    <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-lg dark:border-blue-800 dark:bg-slate-900">
      <div className="mb-6 text-center sm:text-left">
        <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">🔍 Configurar Comparação</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Selecione a praça e as semanas para análise comparativa detalhada
        </p>
      </div>
      
      {/* Tutorial/Instruções para Apresentação */}
      <div className="mb-6 rounded-lg border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50 p-4 dark:border-purple-700 dark:from-purple-950/30 dark:to-pink-950/30">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:text-left">
          <div className="flex-shrink-0 text-2xl">📋</div>
          <div className="flex-1">
            <h4 className="mb-2 font-bold text-purple-900 dark:text-purple-300">Como Gerar a Apresentação em PDF</h4>
            <div className="mb-3 rounded-md bg-amber-100 p-3 text-sm text-amber-900 dark:bg-amber-900/50 dark:text-amber-200">
              <strong>🚧 Em Desenvolvimento:</strong> A função de Apresentação está em desenvolvimento e será disponibilizada em breve.
            </div>
            <ol className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
              <li className="flex items-start gap-2">
                <span className="font-bold text-purple-600 dark:text-purple-400">1.</span>
                <span>Selecione <strong>exatamente 2 semanas</strong> usando os checkboxes abaixo. O botão &quot;📄 Apresentação&quot; só ficará disponível quando exatamente 2 semanas estiverem selecionadas.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-purple-600 dark:text-purple-400">2.</span>
                <span>Clique em <strong>&quot;⚖️ Comparar Semanas&quot;</strong> para carregar os dados das semanas selecionadas.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-purple-600 dark:text-purple-400">3.</span>
                <span>Após a comparação ser concluída, clique em <strong>&quot;📄 Apresentação&quot;</strong> para abrir o preview da apresentação.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-purple-600 dark:text-purple-400">4.</span>
                <span>No preview, você pode navegar pelos slides usando os botões &quot;Anterior&quot; e &quot;Próximo&quot;, e então clicar em <strong>&quot;Gerar PDF&quot;</strong> para baixar a apresentação completa em alta qualidade.</span>
              </li>
            </ol>
            <div className="mt-3 rounded-md bg-purple-100 p-2 text-xs text-purple-900 dark:bg-purple-900/50 dark:text-purple-200">
              <strong>⚠️ Importante:</strong> A apresentação só pode ser gerada com exatamente 2 semanas selecionadas. Se você selecionar 1, 3 ou mais semanas, o botão ficará desabilitado.
            </div>
          </div>
        </div>
      </div>
      
      {/* Filtro de Praça */}
      <div className="mb-6">
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
      <div>
        <label className="mb-3 block text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
          Semanas (selecione 2 ou mais)
        </label>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
          {todasSemanas.map((semana) => {
            // Extrair número da semana para comparação e exibição
            const semanaStr = String(semana);
            let semanaNumStr = semanaStr;
            if (semanaStr.includes('W')) {
              const match = semanaStr.match(/W(\d+)/);
              semanaNumStr = match ? match[1] : semanaStr;
            }
            
            return (
              <label
                key={semanaStr}
                className={`flex cursor-pointer items-center justify-center rounded-lg border-2 p-3 text-center transition-all hover:scale-105 ${
                  semanasSelecionadas.includes(semanaNumStr)
                    ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={semanasSelecionadas.includes(semanaNumStr)}
                  onChange={() => onToggleSemana(semana)}
                />
                <span className="text-sm font-bold">{semanaNumStr}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Botão de Comparar */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-center text-sm text-slate-600 dark:text-slate-400 sm:text-left">
          {semanasSelecionadas.length > 0 && (
            <span>
              {semanasSelecionadas.length} semana{semanasSelecionadas.length !== 1 ? 's' : ''} selecionada{semanasSelecionadas.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-3 sm:justify-end">
          {semanasSelecionadas.length > 0 && (
            <button
              onClick={onClearSemanas}
              className="rounded-lg bg-slate-200 px-5 py-2.5 font-semibold text-slate-700 transition-all hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              Limpar
            </button>
          )}
          <button
            onClick={onComparar}
            disabled={semanasSelecionadas.length < 2 || loading}
            className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 font-semibold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:scale-100 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            {loading ? '⏳ Comparando...' : '⚖️ Comparar Semanas'}
          </button>
          
          <button
            onClick={onMostrarApresentacao}
            disabled={semanasSelecionadas.length !== 2 || dadosComparacaoLength !== 2}
            className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2.5 font-semibold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:scale-100 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            title={semanasSelecionadas.length !== 2 ? 'Selecione exatamente 2 semanas para gerar a apresentação' : 'Gerar apresentação em PDF'}
          >
            📄 Apresentação
          </button>
        </div>
      </div>
    </div>
  );
};

