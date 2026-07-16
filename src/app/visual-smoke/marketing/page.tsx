'use client';

import React from 'react';
import { MarketingReportSlides } from '@/app/apresentacao/marketing/components/MarketingReportSlides';
import { generatePrintStyles } from '@/utils/apresentacao/printPageHelpers';
import type { MarketingCityData, MarketingCostData } from '@/types';

const cityNames = [
  'São Paulo 2.0',
  'Salvador 2.0',
  'Guarulhos 2.0',
  'Manaus 2.0',
  'Sorocaba 2.0',
  'Taboão da Serra e Embu das Artes 2.0',
  'Santo André',
  'São Bernardo',
];

const citiesData: MarketingCityData[] = cityNames.map((cidade, index) => ({
  cidade,
  criado: 320 - (index * 24),
  enviado: 220 - (index * 16),
  liberado: 148 - (index * 10),
  rodandoInicio: 96 - (index * 7),
  aberto: 32 + index,
  voltou: 12 + index,
  conversas: 180 - (index * 11),
}));

const evolutionData = Array.from({ length: 16 }, (_, index) => ({
  data: `2026-07-${String(index + 1).padStart(2, '0')}`,
  liberado: 38 + ((index * 7) % 31),
  enviado: 62 + ((index * 11) % 44),
}));

const weeklyData = Array.from({ length: 4 }, (_, index) => ({
  semana: `S${27 + index}`,
  criado: 460 + (index * 42),
  enviado: 330 + (index * 35),
  liberado: 240 + (index * 28),
  rodando: 160 + (index * 17),
  conversas: 540 + (index * 31),
}));

const weeklyDataByCity = cityNames.slice(0, 6).map((cidade, cityIndex) => ({
  cidade,
  data: weeklyData.map((week, weekIndex) => ({
    ...week,
    criado: Math.max(0, week.criado - (cityIndex * 48) + (weekIndex * 4)),
    enviado: Math.max(0, week.enviado - (cityIndex * 34)),
    liberado: Math.max(0, week.liberado - (cityIndex * 24)),
    rodando: Math.max(0, week.rodando - (cityIndex * 15)),
  })),
}));

function makeCosts(multiplier: number): MarketingCostData[] {
  return cityNames.slice(0, 5).concat('ABC 2.0').map((regiao, index) => {
    const valorUsado = (920 - (index * 95)) * multiplier;
    const rodando = Math.round((82 - (index * 8)) * multiplier);
    return {
      regiao,
      valorUsado,
      rodando,
      liberado: Math.round((126 - (index * 9)) * multiplier),
      aberto: 18 + index,
      conversas: Math.round((280 - (index * 22)) * multiplier),
      cpa: rodando > 0 ? valorUsado / rodando : 0,
    };
  });
}

export default function MarketingVisualSmokePage() {
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: generatePrintStyles() }} />
      <MarketingReportSlides
        citiesData={citiesData}
        evolutionData={evolutionData}
        weeklyData={weeklyData}
        weeklyDataByCity={weeklyDataByCity}
        costsComparison={{ atual: makeCosts(1), passada: makeCosts(0.72) }}
        titulo="Apresentação Marketing"
        periodoFormatado="1 a 16 de julho"
      />
    </div>
  );
}
