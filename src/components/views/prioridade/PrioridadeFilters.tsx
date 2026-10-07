import React from 'react';
import { CheckCircle2, Flag, Megaphone, X, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface PrioridadeFiltersProps {
  filtroAderencia: string;
  filtroRejeicao: string;
  filtroCompletadas: string;
  filtroAceitas: string;
  onAderenciaChange: (value: string) => void;
  onRejeicaoChange: (value: string) => void;
  onCompletadasChange: (value: string) => void;
  onAceitasChange: (value: string) => void;
  onClearFilters: () => void;
}

interface FilterPreset {
  value: string;
  label: string;
}

interface FilterFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: LucideIcon;
  placeholder: string;
  presets: FilterPreset[];
}

export const PrioridadeFilters: React.FC<PrioridadeFiltersProps> = ({
  filtroAderencia,
  filtroRejeicao,
  filtroCompletadas,
  filtroAceitas,
  onAderenciaChange,
  onRejeicaoChange,
  onCompletadasChange,
  onAceitasChange,
  onClearFilters,
}) => {
  const hasFilters = filtroAderencia || filtroRejeicao || filtroCompletadas || filtroAceitas;

  return (
    <section
      aria-labelledby="prioridade-filters-title"
      className="overflow-hidden rounded-xl border border-[#d8e4eb] bg-white shadow-[0_8px_28px_-24px_rgba(15,57,82,0.5)] dark:border-slate-800 dark:bg-slate-950/80"
    >
      <header className="flex min-w-0 items-center justify-between gap-3 border-b border-[#e2ebf0] px-4 py-3 dark:border-slate-800 sm:px-5">
        <div className="min-w-0">
          <h2 id="prioridade-filters-title" className="text-[15px] font-semibold tracking-tight text-[#183f58] dark:text-slate-100">
            Filtros de desempenho
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Defina limites mínimos e máximos para os indicadores.</p>
        </div>
        {hasFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#d8e4eb] bg-white px-3 text-xs font-semibold text-slate-600 transition-colors duration-150 hover:border-rose-300 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-rose-700 dark:hover:text-rose-300"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Limpar filtros
          </button>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
        <FilterField
          id="prioridade-aderencia"
          label="Aderência mínima"
          value={filtroAderencia}
          onChange={onAderenciaChange}
          icon={CheckCircle2}
          placeholder="Ex.: 90"
          presets={[{ value: '95', label: '95%' }, { value: '90', label: '90%' }, { value: '80', label: '80%' }, { value: '', label: 'Qualquer' }]}
        />
        <FilterField
          id="prioridade-rejeicao"
          label="Rejeição máxima"
          value={filtroRejeicao}
          onChange={onRejeicaoChange}
          icon={XCircle}
          placeholder="Ex.: 10"
          presets={[{ value: '5', label: '5%' }, { value: '10', label: '10%' }, { value: '15', label: '15%' }, { value: '', label: 'Qualquer' }]}
        />
        <FilterField
          id="prioridade-completadas"
          label="Completadas mínimas"
          value={filtroCompletadas}
          onChange={onCompletadasChange}
          icon={Flag}
          placeholder="Ex.: 80"
          presets={[{ value: '95', label: '95%' }, { value: '90', label: '90%' }, { value: '85', label: '85%' }, { value: '', label: 'Qualquer' }]}
        />
        <FilterField
          id="prioridade-aceitas"
          label="Aceitas mínimas"
          value={filtroAceitas}
          onChange={onAceitasChange}
          icon={Megaphone}
          placeholder="Ex.: 85"
          presets={[{ value: '95', label: '95%' }, { value: '90', label: '90%' }, { value: '85', label: '85%' }, { value: '', label: 'Qualquer' }]}
        />
      </div>
    </section>
  );
};

function FilterField({ id, label, value, onChange, icon: Icon, placeholder, presets }: FilterFieldProps) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-[#183f58] dark:text-slate-200">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          id={id}
          type="number"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          min="0"
          max="100"
          step="0.1"
          className="h-10 w-full rounded-lg border border-[#d8e4eb] bg-white pl-9 pr-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 transition-colors duration-150 focus:border-[#38708e] focus:outline-none focus:ring-2 focus:ring-[#38708e]/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>
      <div role="group" className="mt-2 flex flex-wrap gap-1.5" aria-label={`Atalhos para ${label.toLowerCase()}`}>
        {presets.map((preset) => {
          const active = preset.value === '' ? !value : value === preset.value;

          return (
            <button
              key={`${id}-${preset.label}`}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(preset.value)}
              className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38708e] focus-visible:ring-offset-1 ${active
                ? 'border-[#174d70] bg-[#174d70] text-white'
                : 'border-[#e2ebf0] bg-[#f6f9fb] text-slate-600 hover:border-[#afc5d1] hover:bg-[#edf4f7] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800'
                }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
