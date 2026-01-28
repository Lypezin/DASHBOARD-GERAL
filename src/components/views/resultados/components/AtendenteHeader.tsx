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
            {/* Foto com borda gradient */}
            <div className={`
            relative shrink-0 p-[3px] rounded-full 
            ${metaAtingida
                    ? 'bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-400'
                    : 'bg-gradient-to-br from-purple-400 via-pink-500 to-purple-400'
                }
            shadow-lg group-hover:shadow-xl transition-shadow duration-300
          `}>
                {atendenteData.fotoUrl && !imageError ? (
                    <div className="relative h-16 w-16 overflow-hidden rounded-full bg-white dark:bg-slate-900">
                        <Image
                            src={atendenteData.fotoUrl}
                            alt={atendenteData.nome}
                            width={64}
                            height={64}
                            className="h-full w-full object-cover"
                            unoptimized
                            onError={onImageError}
                        />
                    </div>
                ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold text-lg">
                        {iniciais}
                    </div>
                )}
                {/* Badge de status */}
                {metaAtingida && (
                    <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 shadow-lg">
                        <Sparkles className="h-3 w-3 text-white" />
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
                                ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                                : taxaConversao >= 25
                                    ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                                    : 'bg-gradient-to-r from-rose-400 to-pink-500'
                                }`}
                            style={{ width: `${Math.min(taxaConversao, 100)}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
