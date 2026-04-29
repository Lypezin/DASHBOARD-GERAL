'use client';

import React, { useState } from 'react';
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
    <div className="rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/80 transition-all duration-200 hover:shadow-md overflow-hidden">
      <div className="p-5 space-y-4">
        {/* 2-column layout on 2xl */}
        <div className="grid gap-5 2xl:grid-cols-[320px_minmax(0,1fr)] 2xl:items-start">
          {/* Left: profile + metrics */}
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

          {/* Right: city breakdown */}
          <div className="space-y-3">
            {/* Coverage badge */}
            <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5 border border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Cobertura
                </p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {activeCidades.length} {activeCidades.length === 1 ? 'cidade' : 'cidades'}
                </p>
              </div>
            </div>

            {atendenteData.cidades && (
              <CityMetricsList cidades={atendenteData.cidades} atendenteNome={atendenteData.nome} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

AtendenteCard.displayName = 'AtendenteCard';
