import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Check } from 'lucide-react';
import { SecoesVisiveis } from '../hooks/useComparacaoFilters';

interface SecaoItem {
    id: keyof SecoesVisiveis;
    label: string;
}

const SECOES: SecaoItem[] = [
    { id: 'metricas', label: 'Cards de metricas' },
    { id: 'detalhada', label: 'Analise detalhada' },
    { id: 'por_dia', label: 'Tabela por dia' },
    { id: 'aderencia_dia', label: 'Aderencia por dia' },
    { id: 'sub_praca', label: 'Por sub praca' },
    { id: 'por_origem', label: 'Por origem' },
    { id: 'origem_detalhada', label: 'Analise detalhada por origem' },
    { id: 'utr', label: 'UTR' },
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
        const handleClick = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const totalVisiveis = Object.values(secoesVisiveis).filter(Boolean).length;
    const total = SECOES.length;

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((prev) => !prev)}
                className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] transition-[background-color,border-color,color,box-shadow,transform] duration-200 ${open
                    ? 'border-slate-900 bg-slate-900 text-white shadow-[0_16px_30px_-22px_rgba(15,23,42,0.7)] dark:border-white dark:bg-white dark:text-slate-900'
                    : 'border-slate-200/80 bg-white/82 text-slate-500 shadow-[0_12px_26px_-22px_rgba(15,23,42,0.45)] hover:-translate-y-0.5 hover:border-sky-300 hover:text-sky-600 dark:border-slate-800/80 dark:bg-slate-900/82 dark:text-slate-400 dark:hover:border-sky-500/50 dark:hover:text-sky-300'
                    }`}
                title="Escolher secoes visiveis"
            >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Exibicao</span>
                {totalVisiveis < total ? (
                    <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black ${open ? 'bg-white/20 text-white dark:bg-slate-900/10 dark:text-slate-900' : 'bg-sky-500 text-white'}`}>
                        {totalVisiveis}
                    </span>
                ) : null}
            </button>

            {open ? (
                <div className="absolute right-0 top-full z-50 mt-3 min-w-[270px] overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/94 p-3 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.42)] backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/92 dark:shadow-black/40">
                    <div className="mb-2 px-4 py-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                            Configurar exibicao
                        </p>
                    </div>

                    <div className="space-y-1">
                        {SECOES.map((secao) => {
                            const isVisible = secoesVisiveis[secao.id];

                            return (
                                <button
                                    key={secao.id}
                                    onClick={() => onToggleSecao(secao.id)}
                                    className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                >
                                    <div
                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${isVisible
                                            ? 'border-sky-500 bg-sky-500 shadow-[0_10px_24px_-16px_rgba(14,165,233,0.9)]'
                                            : 'border-slate-200 bg-transparent group-hover:border-slate-300 dark:border-slate-800 dark:group-hover:border-slate-700'
                                            }`}
                                    >
                                        {isVisible ? <Check className="h-3 w-3 text-white" strokeWidth={4} /> : null}
                                    </div>
                                    <span className={`text-[13px] transition-colors ${isVisible ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {secao.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : null}
        </div>
    );
};
