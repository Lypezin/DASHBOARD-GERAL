import React, { useState } from 'react';
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

    return (
        <div className="flex items-center gap-4">
            {/* Foto com borda simples */}
            <div className="relative shrink-0 p-[2px] rounded-full ring-1 ring-slate-200 dark:ring-slate-700 bg-white dark:bg-slate-800">
                {atendenteData.fotoUrl && !imageError ? (
                    <div className="relative h-12 w-12 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
                        <Image
                            src={atendenteData.fotoUrl}
                            alt={atendenteData.nome}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                            unoptimized
                            onError={onImageError}
                        />
                    </div>
                ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm">
                        {iniciais}
                    </div>
                )}
                {/* Badge de status */}
                {metaAtingida && (
                    <div className="absolute -bottom-0.5 -right-0.5 p-1 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900">
                        <Sparkles className="h-2.5 w-2.5 text-white" />
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate" title={atendenteData.nome}>
                    {atendenteData.nome}
                </h3>
                {/* Mini barra de taxa de conversão */}
                <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                        <span>Conversão</span>
                        <span className="font-semibold font-mono">{taxaConversao.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ${taxaConversao >= 50
                                ? 'bg-emerald-500'
                                : taxaConversao >= 25
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                            style={{ width: `${Math.min(taxaConversao, 100)}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
