import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LayoutDashboard, Check } from 'lucide-react';
import { SecoesVisiveis } from '../hooks/useComparacaoFilters';

interface SecaoItem {
    id: keyof SecoesVisiveis;
    label: string;
}

const SECOES: SecaoItem[] = [
    { id: 'metricas', label: 'Cards de métricas' },
    { id: 'detalhada', label: 'Análise detalhada' },
    { id: 'por_dia', label: 'Tabela por dia' },
    { id: 'aderencia_dia', label: 'Aderência por dia' },
    { id: 'sub_praca', label: 'Por sub-praça' },
    { id: 'por_origem', label: 'Por origem' },
    { id: 'origem_detalhada', label: 'Análise detalhada por origem' },
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
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const position = useFixedDropdownPosition(open, triggerRef);

    useEffect(() => {
        if (!open) return;

        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (triggerRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;
            setOpen(false);
        };

        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, [open]);

    const totalVisiveis = Object.values(secoesVisiveis).filter(Boolean).length;
    const total = SECOES.length;

    return (
        <>
            <button
                ref={triggerRef}
                onClick={() => setOpen((prev) => !prev)}
                aria-expanded={open}
                className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#174d70] ${open
                    ? 'border-white bg-white text-[#174d70]'
                    : 'border-white/25 bg-white/10 text-white hover:border-white/40 hover:bg-white/20'
                    }`}
                title="Escolher seções visíveis"
                type="button"
            >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Exibição</span>
                {totalVisiveis < total ? (
                    <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${open ? 'bg-[#174d70]/10 text-[#174d70]' : 'bg-white/20 text-white'}`}>
                        {totalVisiveis}
                    </span>
                ) : null}
            </button>

            {open && position && typeof document !== 'undefined'
                ? createPortal(
                    <div
                        ref={dropdownRef}
                        style={{ left: position.left, top: position.top, width: position.width, maxHeight: position.maxHeight }}
                        className="fixed z-[100000] overflow-hidden rounded-xl border border-slate-200 bg-white p-2.5 shadow-[0_12px_34px_-22px_rgba(15,23,42,0.4)] animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/40"
                    >
                        <div className="mb-2 px-2 py-1.5">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                Configurar exibição
                            </p>
                        </div>

                        <div className="subtle-scrollbar space-y-1 overflow-y-auto pr-1" style={{ maxHeight: Math.max(180, position.maxHeight - 52) }}>
                            {SECOES.map((secao) => {
                                const isVisible = secoesVisiveis[secao.id];

                                return (
                                    <button
                                        key={secao.id}
                                        onClick={() => onToggleSecao(secao.id)}
                                        className="group flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-inset dark:hover:bg-slate-800/50"
                                        type="button"
                                        title={secao.label}
                                    >
                                        <div
                                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${isVisible
                                                ? 'border-[#174d70] bg-[#174d70]'
                                                : 'border-slate-200 bg-transparent group-hover:border-slate-300 dark:border-slate-800 dark:group-hover:border-slate-700'
                                                }`}
                                        >
                                            {isVisible ? <Check className="h-3 w-3 text-white" strokeWidth={4} /> : null}
                                        </div>
                                        <span className={`min-w-0 whitespace-normal text-[13px] leading-snug transition-colors ${isVisible ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {secao.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>,
                    document.body
                )
                : null}
        </>
    );
};

function useFixedDropdownPosition(open: boolean, anchorRef: React.RefObject<HTMLElement>) {
    const [position, setPosition] = useState<{ left: number; top: number; width: number; maxHeight: number } | null>(null);

    useLayoutEffect(() => {
        if (!open || typeof window === 'undefined') return;

        const updatePosition = () => {
            const anchor = anchorRef.current;
            if (!anchor) return;

            const rect = anchor.getBoundingClientRect();
            const margin = 12;
            const width = Math.min(320, window.innerWidth - margin * 2);
            const left = Math.min(Math.max(margin, rect.right - width), window.innerWidth - width - margin);
            const spaceBelow = window.innerHeight - rect.bottom - margin;
            const spaceAbove = rect.top - margin;
            const openAbove = spaceBelow < 330 && spaceAbove > spaceBelow;
            const maxHeight = Math.max(220, Math.min(430, openAbove ? spaceAbove : spaceBelow));
            const top = openAbove ? Math.max(margin, rect.top - maxHeight - 8) : rect.bottom + 8;

            setPosition({ left, top, width, maxHeight });
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [anchorRef, open]);

    return position;
}
