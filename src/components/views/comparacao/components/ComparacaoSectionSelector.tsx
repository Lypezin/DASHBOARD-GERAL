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
                className={`flex items-center gap-2.5 px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-full border-2 transition-all duration-300
                    ${open
                        ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900 shadow-lg'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                    }`}
                title="Escolher seções visíveis"
            >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exibição</span>
                {totalVisiveis < total && (
                    <span className={`flex items-center justify-center w-4 h-4 text-[9px] font-black rounded-full shadow-sm ${open ? 'bg-white/20 text-white dark:bg-slate-900/10 dark:text-slate-900' : 'bg-indigo-500 text-white'}`}>
                        {totalVisiveis}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-3 z-50 bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_20px_70px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_70px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-slate-800/60 min-w-[260px] overflow-hidden p-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="px-5 py-3 mb-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                            Configurar Visualização
                        </p>
                    </div>
                    <div className="space-y-1">
                        {SECOES.map((secao) => {
                            const isVisible = secoesVisiveis[secao.id];
                            return (
                                <button
                                    key={secao.id}
                                    onClick={() => onToggleSecao(secao.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-left group"
                                >
                                    <div className={`flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-lg border-2 transition-all ${isVisible
                                        ? 'bg-indigo-500 border-indigo-500 shadow-md shadow-indigo-500/20'
                                        : 'bg-transparent border-slate-200 dark:border-slate-800 group-hover:border-slate-300 dark:group-hover:border-slate-700'
                                        }`}>
                                        {isVisible && (
                                            <Check className="w-3 h-3 text-white" strokeWidth={4} />
                                        )}
                                    </div>
                                    <span className={`text-[13px] transition-colors ${isVisible ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
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
