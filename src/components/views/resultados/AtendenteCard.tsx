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

  const metaInfoAtendente = calcularMetaInfo(
    atendenteData.custoPorLiberado,
    atendenteData.quantidadeLiberados,
    atendenteData.valorTotal
  );

  const metaAtingida = metaInfoAtendente?.jaAtingiuMeta ?? false;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      {/* Top section: Profile + summary metrics */}
      <div className="p-5 pb-4">
        <AtendenteHeader
          atendenteData={atendenteData}
          metaAtingida={metaAtingida}
          imageError={imageError}
          onImageError={() => setImageError(true)}
        />

        <div className="mt-4">
          <AtendenteMetrics atendenteData={atendenteData} />
        </div>

        <AtendenteMetaStatus
          atendenteData={atendenteData}
          metaInfoAtendente={metaInfoAtendente}
        />
      </div>

      {/* Bottom section: City breakdown — full width, no padding sides */}
      {atendenteData.cidades && atendenteData.cidades.some(c => c.enviado > 0 || c.liberado > 0) && (
        <div className="border-t border-slate-100 dark:border-slate-800 py-2">
          <CityMetricsList cidades={atendenteData.cidades} atendenteNome={atendenteData.nome} />
        </div>
      )}
    </div>
  );
});

AtendenteCard.displayName = 'AtendenteCard';
