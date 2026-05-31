import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, X, CheckCircle2, XCircle, Flag, Megaphone } from 'lucide-react';

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
    <Card className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.3)] backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/40">
      <CardContent className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
              <Filter className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-200">Filtros avançados</h3>
          </div>

          {hasFilters && (
            <button 
              onClick={onClearFilters} 
              className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600 transition-all hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/50"
            >
              <X className="h-3.5 w-3.5" /> Limpar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Filtro Aderência */}
          <div className="flex flex-col">
            <label className="mb-2 pl-0.5 text-xs font-bold tracking-wide text-slate-500 dark:text-slate-400 uppercase">% Aderência mínima</label>
            <div className="relative">
              <CheckCircle2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="number" 
                placeholder="Ex: 90" 
                value={filtroAderencia} 
                onChange={(e) => onAderenciaChange(e.target.value)} 
                min="0" 
                max="100" 
                step="0.1" 
                className="w-full rounded-xl border border-slate-200/90 bg-slate-50/50 pl-10 pr-3 py-2 text-sm font-semibold text-slate-900 placeholder-slate-400 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:outline-none dark:border-slate-800 dark:bg-slate-950/70 dark:text-white dark:placeholder-slate-650" 
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 pl-0.5">
              {['95', '90', '80', '0'].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => onAderenciaChange(val === '0' ? '' : val)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-all ${filtroAderencia === val || (val === '0' && !filtroAderencia) ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/10' : 'bg-slate-100/80 hover:bg-slate-200 text-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-400'}`}
                >
                  {val === '0' ? 'Zerar' : `${val}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro Rejeição */}
          <div className="flex flex-col">
            <label className="mb-2 pl-0.5 text-xs font-bold tracking-wide text-slate-500 dark:text-slate-400 uppercase">% Rejeição máxima</label>
            <div className="relative">
              <XCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="number" 
                placeholder="Ex: 10" 
                value={filtroRejeicao} 
                onChange={(e) => onRejeicaoChange(e.target.value)} 
                min="0" 
                max="100" 
                step="0.1" 
                className="w-full rounded-xl border border-slate-200/90 bg-slate-50/50 pl-10 pr-3 py-2 text-sm font-semibold text-slate-900 placeholder-slate-400 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:outline-none dark:border-slate-800 dark:bg-slate-950/70 dark:text-white dark:placeholder-slate-650" 
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 pl-0.5">
              {['5', '10', '15', '0'].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => onRejeicaoChange(val === '0' ? '' : val)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-all ${filtroRejeicao === val || (val === '0' && !filtroRejeicao) ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/10' : 'bg-slate-100/80 hover:bg-slate-200 text-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-400'}`}
                >
                  {val === '0' ? 'Zerar' : `${val}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro Completadas */}
          <div className="flex flex-col">
            <label className="mb-2 pl-0.5 text-xs font-bold tracking-wide text-slate-500 dark:text-slate-400 uppercase">% Completadas mínima</label>
            <div className="relative">
              <Flag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="number" 
                placeholder="Ex: 80" 
                value={filtroCompletadas} 
                onChange={(e) => onCompletadasChange(e.target.value)} 
                min="0" 
                max="100" 
                step="0.1" 
                className="w-full rounded-xl border border-slate-200/90 bg-slate-50/50 pl-10 pr-3 py-2 text-sm font-semibold text-slate-900 placeholder-slate-400 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:outline-none dark:border-slate-800 dark:bg-slate-950/70 dark:text-white dark:placeholder-slate-650" 
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 pl-0.5">
              {['95', '90', '85', '0'].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => onCompletadasChange(val === '0' ? '' : val)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-all ${filtroCompletadas === val || (val === '0' && !filtroCompletadas) ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/10' : 'bg-slate-100/80 hover:bg-slate-200 text-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-400'}`}
                >
                  {val === '0' ? 'Zerar' : `${val}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro Aceitas */}
          <div className="flex flex-col">
            <label className="mb-2 pl-0.5 text-xs font-bold tracking-wide text-slate-500 dark:text-slate-400 uppercase">% Aceitas mínima</label>
            <div className="relative">
              <Megaphone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="number" 
                placeholder="Ex: 85" 
                value={filtroAceitas} 
                onChange={(e) => onAceitasChange(e.target.value)} 
                min="0" 
                max="100" 
                step="0.1" 
                className="w-full rounded-xl border border-slate-200/90 bg-slate-50/50 pl-10 pr-3 py-2 text-sm font-semibold text-slate-900 placeholder-slate-400 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:outline-none dark:border-slate-800 dark:bg-slate-950/70 dark:text-white dark:placeholder-slate-650" 
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 pl-0.5">
              {['95', '90', '85', '0'].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => onAceitasChange(val === '0' ? '' : val)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-all ${filtroAceitas === val || (val === '0' && !filtroAceitas) ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/10' : 'bg-slate-100/80 hover:bg-slate-200 text-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-400'}`}
                >
                  {val === '0' ? 'Zerar' : `${val}%`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
