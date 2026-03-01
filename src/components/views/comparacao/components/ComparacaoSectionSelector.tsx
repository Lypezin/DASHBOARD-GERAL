import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Check } from 'lucide-react';
import { SecoesVisiveis } from '../hooks/useComparacaoFilters';

interface SecaoItem {
    id: keyof SecoesVisiveis;
    label: string;
}

const SECOES: SecaoItem[] = [
    { id: 'metricas', label: 'Cards de Métricas' }, { id: 'detalhada', label: 'Análise Detalhada' },
    { id: 'por_dia', label: 'Tabela por Dia' }, { id: 'aderencia_dia', label: 'Aderência por Dia' },
    { id: 'sub_praca', label: 'Por Sub-Praça' }, { id: 'por_origem', label: 'Por Origem' },
    { id: 'origem_detalhada', label: 'Análise Detalhada por Origem' }, { id: 'utr', label: 'UTR' },
];

interface ComparacaoSectionSelectorProps {
    secoesVisiveis: SecoesVisiveis;
    onToggleSecao: (secao: keyof SecoesVisiveis) => void;
}

export const ComparacaoSectionSelector: React.FC<ComparacaoSectionSelectorProps> = ({
    secoesVisiveis,
    onToggleSecao,
}) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const totalVisiveis = Object.values(secoesVisiveis).filter(Boolean).length;
    const total = SECOES.length;

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(prev => !prev)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors
                    ${open
                        ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                    }`}
                title="Escolher seções visíveis"
            >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Seções</span>
                {totalVisiveis < total && (
                    <span className="flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-blue-500 text-white rounded-full">
                        {totalVisiveis}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 min-w-[230px] overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Seções Visíveis
                        </p>
                    </div>
                    <div className="py-1.5">
                        {SECOES.map((secao) => {
                            const isVisible = secoesVisiveis[secao.id];
                            return (
                                <button
                                    key={secao.id}
                                    onClick={() => onToggleSecao(secao.id)}
                                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left"
                                >
                                    <span className={`flex-shrink-0 flex items-center justify-center w-4 h-4 rounded border transition-colors ${isVisible
                                        ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white'
                                        : 'bg-transparent border-slate-300 dark:border-slate-600'
                                        }`}>
                                        {isVisible && (
                                            <Check className={`w-2.5 h-2.5 ${isVisible ? 'text-white dark:text-slate-900' : ''}`} />
                                        )}
                                    </span>
                                    <span className={`text-sm transition-colors ${isVisible ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                                        {secao.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
