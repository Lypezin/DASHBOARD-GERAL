'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { BarChart3, Home, MapPin, Target, Truck } from 'lucide-react';
import type { Filters, FilterOption } from '@/types';
import FiltroBar from '@/components/shared/filters/FiltroBar';
import { CityUpdatesMarquee } from '@/components/dashboard/CityLastUpdatesTicker';
import { DashboardOverviewStats } from '@/components/views/dashboard/DashboardOverviewStats';
import { DashboardOverviewAnalysis } from '@/components/views/dashboard/DashboardOverviewAnalysis';
import { AppBootstrapProvider } from '@/contexts/AppBootstrapContext';
import { OrganizationProvider } from '@/contexts/OrganizationContext';

const options = (values: string[]): FilterOption[] => values.map((value) => ({ value, label: value }));
const days = [900, 1000, 1240, 1600, 1310, 1140, 1370].map((offered, index) => ({
  data: `2026-09-${String(index + 5).padStart(2, '0')}`,
  dia: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'][index],
  dia_iso: index + 1,
  corridas_ofertadas: offered,
  corridas_aceitas: Math.round(offered * 0.73),
  aderencia_percentual: 72 + index * 0.8,
}));
const subPlazas = [
  { sub_praca: 'Guarulhos', corridas_ofertadas: 12340, aderencia_percentual: 76.2 },
  { sub_praca: 'Centro', corridas_ofertadas: 6110, aderencia_percentual: 72.1 },
];
const cities = [
  { city: 'Guarulhos', date: '29/09' },
  { city: 'Manaus', date: '28/09' },
  { city: 'São Paulo 2.0', date: '27/09' },
  { city: 'Sorocaba', date: '26/09' },
];

export function FolhasPreview() {
  return <AppBootstrapProvider><OrganizationProvider><FolhasPreviewContent /></OrganizationProvider></AppBootstrapProvider>;
}

function FolhasPreviewContent() {
  const [filters, setFilters] = useState<Filters>({
    ano: 2026, semana: null, semanas: [5, 6, 7], praca: null, subPraca: null, origem: null, turno: null,
    subPracas: [], origens: [], turnos: [], filtroModo: 'ano_semana', dataInicial: null, dataFinal: null,
  });

  return (
    <div className="folhas-world flex min-h-screen bg-background">
      <aside className="hidden w-[260px] shrink-0 flex-col bg-[hsl(var(--sidebar))] px-4 py-6 text-white md:flex">
        <Image src="/logo.png" alt="GO Itaim" width={160} height={160} className="mx-auto h-36 w-36 object-contain" />
        <p className="mt-5 border-t border-white/40 py-5 text-center text-xs font-semibold uppercase tracking-[0.15em]">Dashboard Geral</p>
        <p className="mt-4 text-xs uppercase tracking-wider text-white/75">Principal</p>
        <div className="mt-2 flex items-center gap-3 rounded-md bg-[hsl(var(--sidebar-active))] px-3 py-3 font-semibold text-[#091634]"><Home className="h-4 w-4" />Visão Geral</div>
        <div className="mt-1 flex items-center gap-3 px-3 py-3"><BarChart3 className="h-4 w-4" />Análise</div>
        <div className="mt-1 flex items-center gap-3 px-3 py-3"><Target className="h-4 w-4" />UTR</div>
        <p className="mt-8 text-xs uppercase tracking-wider text-white/75">Operacional</p>
        <div className="mt-2 flex items-center gap-3 px-3 py-3"><Truck className="h-4 w-4" />Entregadores</div>
        <div className="mt-1 flex items-center gap-3 px-3 py-3"><MapPin className="h-4 w-4" />Praças</div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex min-h-16 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-card px-4 py-3 lg:flex-nowrap">
          <div className="order-1 shrink-0 text-sm font-semibold">Principal <span className="mx-2 text-muted-foreground">›</span> Visão Geral</div>
          <div className="order-3 min-w-0 w-full border-t border-border pt-2 lg:order-2 lg:w-auto lg:flex-1 lg:border-0 lg:pt-0"><CityUpdatesMarquee items={cities} /></div>
          <span className="order-2 ml-auto shrink-0 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground lg:order-3">LP</span>
        </header>
        <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-5 lg:px-7">
          <p className="text-xs text-muted-foreground">Prévia local · dados ilustrativos</p>
          <div className="rounded-xl border border-border bg-card p-4">
            <FiltroBar
              filters={filters} setFilters={setFilters} anos={[2026]}
              semanas={['05', '06', '07', '08']} pracas={options(['Guarulhos', 'Centro'])}
              subPracas={options(['Guarulhos', 'Centro'])} origens={options(['iFood', 'App'])}
              turnos={options(['Almoço', 'Jantar'])} currentUser={null}
              disableWeekLookup
            />
          </div>
          <section className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Resumo Operacional</h1>
            <DashboardOverviewStats
              totals={{ ofertadas: 18450, aceitas: 15210, rejeitadas: 3240, completadas: 14990 }}
              adherence={{ semana: '2026-W07', aderencia_percentual: 74.8 }} plazaCount={2} selectedPlaza={filters.praca}
            />
          </section>
          <DashboardOverviewAnalysis days={days} subPlazas={subPlazas} />
        </main>
      </div>
    </div>
  );
}
