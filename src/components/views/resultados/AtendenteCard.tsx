'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Send, Target, Sparkles } from 'lucide-react';
import { AtendenteCidadeData } from '@/types';
import { calcularMetaInfo, META_CUSTO } from '@/utils/resultados/metaCalculations';
import { CityMetricsList } from './components/CityMetricsList';

export interface AtendenteData {
  nome: string;
  enviado: number;
  liberado: number;
  custoPorLiberado?: number;
  quantidadeLiberados?: number;
  valorTotal?: number;
  fotoUrl?: string | null;
  cidades?: AtendenteCidadeData[];
}

interface AtendenteCardProps {
  atendenteData: AtendenteData;
}

export const AtendenteCard = React.memo(function AtendenteCard({
  atendenteData
}: AtendenteCardProps) {
  const [imageError, setImageError] = useState(false);
  const iniciais = atendenteData.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const metaInfoAtendente = calcularMetaInfo(
    atendenteData.custoPorLiberado,
    atendenteData.quantidadeLiberados,
    atendenteData.valorTotal
  );

  const taxaConversao = atendenteData.enviado > 0
    ? ((atendenteData.liberado / atendenteData.enviado) * 100)
    : 0;

  // Determina se atingiu a meta
  const metaAtingida = metaInfoAtendente?.jaAtingiuMeta ?? false;

  return (
    <Card className={`
      border-none shadow-lg hover:shadow-2xl transition-all duration-500 h-full flex flex-col 
      bg-white dark:bg-slate-900/95 backdrop-blur-sm group relative overflow-hidden
      hover:-translate-y-1
    `}>
      {/* Glow effect no hover */}
      <div className={`
        absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
        ${metaAtingida
          ? 'bg-gradient-to-br from-emerald-500/5 to-teal-500/5'
          : 'bg-gradient-to-br from-purple-500/5 to-pink-500/5'
        }
      `} />

      {/* Borda gradient superior */}
      <div className={`
        absolute top-0 left-0 right-0 h-1 
        ${metaAtingida
          ? 'bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400'
          : 'bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400'
        }
      `} />

      <CardContent className="p-5 flex flex-col flex-1 min-h-0 overflow-hidden space-y-4 relative z-10">
        {/* Header com foto e nome */}
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
                  onError={() => setImageError(true)}
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

        {/* Métricas principais */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-3 border border-emerald-100/50 dark:border-emerald-800/30">
            <div className="flex items-center gap-1.5 mb-1">
              <Send className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">Enviado</p>
            </div>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 font-mono">
              {atendenteData.enviado.toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-3 border border-blue-100/50 dark:border-blue-800/30">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              <p className="text-[10px] font-medium text-blue-700 dark:text-blue-300">Liberado</p>
            </div>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300 font-mono">
              {atendenteData.liberado.toLocaleString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Seção de Custo e Meta */}
        {atendenteData.custoPorLiberado !== undefined && atendenteData.custoPorLiberado > 0 && (
          <div className="space-y-3">
            {/* Custo por Liberado */}
            <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 p-3 border border-slate-200/50 dark:border-slate-700/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Target className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                  <p className="text-[10px] font-medium text-slate-600 dark:text-slate-300">Custo por Liberado</p>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(atendenteData.custoPorLiberado)}
                </p>
              </div>
            </div>

            {/* Status da Meta */}
            {metaInfoAtendente && (
              <div className={`
                rounded-xl p-3 border flex items-center gap-3
                ${metaInfoAtendente.jaAtingiuMeta
                  ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800/30'
                  : 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800/30'
                }
              `}>
                {metaInfoAtendente.jaAtingiuMeta ? (
                  <>
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        🎉 Meta atingida!
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        Abaixo de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(META_CUSTO)}
                      </p>
                    </div>
                  </>
                ) : metaInfoAtendente.faltamLiberados > 0 ? (
                  <>
                    <div className="p-2 rounded-lg bg-amber-500/20">
                      <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                        Faltam <span className="font-bold text-sm">{metaInfoAtendente.faltamLiberados}</span> liberados
                      </p>
                      <p className="text-[10px] text-amber-600 dark:text-amber-400">
                        Para atingir {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(META_CUSTO)}
                      </p>
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* Lista de Cidades */}
        {atendenteData.cidades && (
          <CityMetricsList cidades={atendenteData.cidades} atendenteNome={atendenteData.nome} />
        )}
      </CardContent>
    </Card>
  );
});

AtendenteCard.displayName = 'AtendenteCard';
