'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AtendenteCidadeData } from '@/types';
import { calcularMetaInfo } from '@/utils/resultados/metaCalculations';
import { CityMetricsList } from './components/CityMetricsList';
import { AtendenteHeader } from './components/AtendenteHeader';
import { AtendenteMetrics } from './components/AtendenteMetrics';
import { AtendenteMetaStatus } from './components/AtendenteMetaStatus';

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
  const activeCidades = (atendenteData.cidades || []).filter((cidade) => cidade.enviado > 0 || cidade.liberado > 0);

  const metaInfoAtendente = calcularMetaInfo(
    atendenteData.custoPorLiberado,
    atendenteData.quantidadeLiberados,
    atendenteData.valorTotal
  );

  // Determina se atingiu a meta
  const metaAtingida = metaInfoAtendente?.jaAtingiuMeta ?? false;

  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-[background-color,box-shadow] duration-200 h-full bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800/50 group relative overflow-hidden">
      <CardContent className="p-5 space-y-4 relative z-10">
        <div className="grid gap-5 2xl:grid-cols-[320px_minmax(0,1fr)] 2xl:items-start">
          <div className="space-y-4">
            <AtendenteHeader
              atendenteData={atendenteData}
              metaAtingida={metaAtingida}
              imageError={imageError}
              onImageError={() => setImageError(true)}
            />

            <AtendenteMetrics atendenteData={atendenteData} />

            <AtendenteMetaStatus
              atendenteData={atendenteData}
              metaInfoAtendente={metaInfoAtendente}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Cobertura
                </p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {activeCidades.length} cidades com atividade
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  Visão
                </p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Grade completa
                </p>
              </div>
            </div>

            {atendenteData.cidades && (
              <CityMetricsList cidades={atendenteData.cidades} atendenteNome={atendenteData.nome} />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

AtendenteCard.displayName = 'AtendenteCard';
