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

  const metaInfoAtendente = calcularMetaInfo(
    atendenteData.custoPorLiberado,
    atendenteData.quantidadeLiberados,
    atendenteData.valorTotal
  );

  // Determina se atingiu a meta
  const metaAtingida = metaInfoAtendente?.jaAtingiuMeta ?? false;

  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-[background-color,box-shadow] duration-200 h-full flex flex-col bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800/50 group relative overflow-hidden">

      <CardContent className="p-5 flex flex-col flex-1 min-h-0 overflow-hidden space-y-4 relative z-10">
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

        {/* Lista de Cidades */}
        {atendenteData.cidades && (
          <CityMetricsList cidades={atendenteData.cidades} atendenteNome={atendenteData.nome} />
        )}
      </CardContent>
    </Card>
  );
});

AtendenteCard.displayName = 'AtendenteCard';
