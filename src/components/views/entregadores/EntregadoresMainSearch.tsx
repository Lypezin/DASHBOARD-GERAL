import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EntregadoresMainSearchProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    showInactiveOnly: boolean;
    onShowInactiveOnlyChange: (show: boolean) => void;
    isSearching?: boolean;
    variant?: 'entregadores' | 'dedicado';
}

export const EntregadoresMainSearch = React.memo(function EntregadoresMainSearch({
    searchTerm,
    onSearchChange,
    showInactiveOnly,
    onShowInactiveOnlyChange,
    isSearching = false,
    variant = 'entregadores',
}: EntregadoresMainSearchProps) {
    const isEntregadores = variant === 'entregadores';
    const inactiveFilterClasses = cn(
        'group inline-flex w-full items-center justify-center gap-2 border lg:w-auto',
        isEntregadores
            ? 'h-10 rounded-md px-3.5 text-[13px] font-semibold transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/35 focus-visible:ring-offset-2'
            : 'h-12 rounded-2xl px-4 text-sm font-bold transition-[background-color,border-color,color,box-shadow,transform] duration-200 hover:-translate-y-0.5',
        showInactiveOnly
            ? isEntregadores
                ? 'border-[#bfd8e6] bg-[#eaf4f9] text-[#1c5e81] shadow-[inset_0_0_0_1px_rgba(45,117,154,0.06)] dark:border-sky-300/30 dark:bg-sky-950/40 dark:text-sky-100'
                : 'border-rose-200 bg-rose-50 text-rose-700 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/25 dark:text-rose-300'
            : isEntregadores
                ? 'border-[#d7e2e8] bg-white text-slate-600 hover:border-[#92bcd2] hover:bg-[#f5fafd] hover:text-[#1c5e81] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-sky-200'
                : 'border-slate-200/80 bg-white text-slate-600 shadow-sm hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-800/80 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-emerald-500/40 dark:hover:text-emerald-300'
    );

    return (
        <div className={isEntregadores
            ? 'flex flex-col gap-2 rounded-xl border border-[#dce7ed] bg-white p-3 shadow-[0_6px_22px_-20px_rgba(15,57,82,0.45)] lg:flex-row lg:items-center dark:border-slate-700 dark:bg-slate-900'
            : 'rounded-[1.75rem] border border-slate-200/75 bg-white/90 p-4 shadow-[0_18px_46px_-38px_rgba(15,23,42,0.42)] backdrop-blur dark:border-slate-800/75 dark:bg-slate-950/80'}>
            <div className={isEntregadores ? 'flex min-w-0 flex-1 flex-col gap-2 lg:flex-row lg:items-center' : 'flex flex-col gap-3 lg:flex-row lg:items-center'}>
                <div className={`relative min-w-0 flex-1 ${isEntregadores ? 'group' : ''}`}>
                    <Search className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${isEntregadores ? 'transition-colors duration-200 group-focus-within:text-sky-700 dark:group-focus-within:text-sky-400' : ''}`} />
                    <input
                        type="text"
                        aria-label="Pesquisar por nome ou ID do entregador"
                        placeholder="Pesquisar por nome ou ID do entregador..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className={isEntregadores
                            ? 'h-10 w-full rounded-md border border-[#d7e2e8] bg-white py-2 pl-10 pr-4 text-[13px] font-normal text-slate-800 shadow-sm transition-[background-color,border-color,box-shadow] duration-150 placeholder:text-slate-400 focus:border-sky-600/60 focus:outline-none focus:ring-2 focus:ring-sky-600/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-sky-300/60'
                            : 'h-12 w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 py-2 pl-11 pr-4 text-sm font-semibold text-slate-900 shadow-sm transition-[background-color,border-color,box-shadow] duration-150 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/15 dark:border-slate-800/80 dark:bg-slate-900/65 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900'}
                    />
                    {isSearching ? (
                        <span className={`mt-1 block text-right text-xs font-bold lg:absolute lg:right-4 lg:top-1/2 lg:mt-0 lg:-translate-y-1/2 ${isEntregadores ? 'text-sky-700 dark:text-sky-300' : 'text-emerald-600 dark:text-emerald-300'}`}>
                            Atualizando...
                        </span>
                    ) : null}
                </div>

                <button
                    onClick={() => onShowInactiveOnlyChange(!showInactiveOnly)}
                    aria-pressed={showInactiveOnly}
                    className={inactiveFilterClasses}
                    type="button"
                >
                    <SlidersHorizontal className={`h-4 w-4 ${isEntregadores ? 'motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:rotate-6' : ''}`} />
                    {showInactiveOnly ? 'Mostrando inativos' : 'Filtrar inativos'}
                </button>
            </div>
        </div>
    );
});

EntregadoresMainSearch.displayName = 'EntregadoresMainSearch';
