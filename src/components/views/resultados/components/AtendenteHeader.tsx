import React from 'react';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import { AtendenteData } from '../AtendenteCard';

interface AtendenteHeaderProps {
    atendenteData: AtendenteData;
    metaAtingida: boolean;
    imageError: boolean;
    onImageError: () => void;
}

export const AtendenteHeader = ({
    atendenteData,
    metaAtingida,
    imageError,
    onImageError
}: AtendenteHeaderProps) => {
    const iniciais = atendenteData.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const taxaConversao = atendenteData.enviado > 0
        ? ((atendenteData.liberado / atendenteData.enviado) * 100)
        : 0;

    const barColor = taxaConversao >= 50
        ? 'bg-emerald-500'
        : taxaConversao >= 25
            ? 'bg-amber-500'
            : 'bg-rose-400';

    return (
        <div className="flex items-center gap-3.5">
            {/* Avatar */}
            <div className="relative shrink-0">
                {atendenteData.fotoUrl && !imageError ? (
                    <div className="relative h-11 w-11 overflow-hidden rounded-full ring-2 ring-slate-100 dark:ring-slate-800">
                        <Image
                            src={atendenteData.fotoUrl}
                            alt={atendenteData.nome}
                            width={44}
                            height={44}
                            className="h-full w-full object-cover"
                            unoptimized
                            onError={onImageError}
                        />
                    </div>
                ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs ring-2 ring-slate-100 dark:ring-slate-800">
                        {iniciais}
                    </div>
                )}
                {/* Meta badge */}
                {metaAtingida && (
                    <div className="absolute -bottom-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900">
                        <Sparkles className="h-2.5 w-2.5 text-white" />
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white truncate leading-tight" title={atendenteData.nome}>
                    {atendenteData.nome}
                </h3>
                {/* Inline conversion bar */}
                <div className="mt-1.5 flex items-center gap-2.5">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: `${Math.min(taxaConversao, 100)}%` }}
                        />
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                        {taxaConversao.toFixed(1)}%
                    </span>
                </div>
            </div>
        </div>
    );
};
