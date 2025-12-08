'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
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

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 h-full flex flex-col">
      <CardContent className="p-4 flex flex-col flex-1 min-h-0 overflow-hidden space-y-4">
        {/* Card do Atendente - Compacto */}
        <div className="space-y-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            {atendenteData.fotoUrl && !imageError ? (
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-slate-200 dark:border-slate-700">
                <Image
                  src={atendenteData.fotoUrl}
                  alt={atendenteData.nome}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                  unoptimized
                  onError={() => setImageError(true)}
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm border border-slate-200 dark:border-slate-700">
                {iniciais}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={atendenteData.nome}>
                {atendenteData.nome}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md bg-slate-50 dark:bg-slate-900 p-2 border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-medium text-muted-foreground mb-1">Enviado</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">{atendenteData.enviado.toLocaleString('pt-BR')}</p>
            </div>
            <div className="rounded-md bg-slate-50 dark:bg-slate-900 p-2 border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-medium text-muted-foreground mb-1">Liberado</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">{atendenteData.liberado.toLocaleString('pt-BR')}</p>
            </div>
          </div>

          {atendenteData.custoPorLiberado !== undefined && atendenteData.custoPorLiberado > 0 ? (
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="rounded-md bg-slate-50 dark:bg-slate-900 p-2 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-medium text-muted-foreground mb-1">Custo por Liberado</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(atendenteData.custoPorLiberado)}
                </p>
              </div>
              {metaInfoAtendente && (
                <div className={`rounded-md p-2 border ${metaInfoAtendente.jaAtingiuMeta
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30'
                  : 'bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30'
                  }`}>
                  {metaInfoAtendente.jaAtingiuMeta ? (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                        Meta atingida! Abaixo de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(META_CUSTO)}
                      </p>
                    </div>
                  ) : metaInfoAtendente.faltamLiberados > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">🎯</span>
                      <p className="text-[10px] font-medium text-orange-700 dark:text-orange-300">
                        Faltam <span className="font-bold">{metaInfoAtendente.faltamLiberados}</span> para {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(META_CUSTO)}
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {atendenteData.cidades && (
          <CityMetricsList cidades={atendenteData.cidades} atendenteNome={atendenteData.nome} />
        )}
      </CardContent>
    </Card>
  );
});

AtendenteCard.displayName = 'AtendenteCard';
