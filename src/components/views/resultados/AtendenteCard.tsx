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
