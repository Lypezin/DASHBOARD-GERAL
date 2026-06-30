'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { ComparacaoLayout } from '@/components/views/comparacao/ComparacaoLayout';
import type { DashboardResumoData, FilterOption } from '@/types';
import type { SecoesVisiveis, ViewMode } from '@/components/views/comparacao/hooks/useComparacaoFilters';

const semanasSmoke = ['2026-W05', '2026-W07'];

const secoesPadrao: SecoesVisiveis = {
  metricas: true,
  detalhada: true,
  por_dia: true,
  aderencia_dia: true,
  sub_praca: true,
  por_origem: true,
  origem_detalhada: true,
  utr: true,
};

const pracasSmoke: FilterOption[] = [
  { label: 'Todas as praças', value: '' },
  { label: 'Guarulhos', value: 'Guarulhos' },
  { label: 'Centro', value: 'Centro' },
];

const diasSmoke = [
  ['Segunda', 1],
  ['Terça', 2],
  ['Quarta', 3],
  ['Quinta', 4],
  ['Sexta', 5],
  ['Sábado', 6],
  ['Domingo', 7],
] as const;

function seconds(hours: number, minutes = 0, sec = 0) {
  return (hours * 3600) + (minutes * 60) + sec;
}

function makeWeekData(week: string, factor: number): DashboardResumoData {
  const subPracas = [
    ['Centro Expandido Norte', 21.2 + factor, 32993, 6804 + (factor * 210), 18450, 15120],
    ['Leste Operacional', 18.4 + factor, 28420, 6016 + (factor * 180), 15280, 12840],
    ['Zona Sul Premium', 26.8 + factor, 22140, 5934 + (factor * 160), 11220, 9820],
    ['Região Oeste', 19.9 + factor, 19120, 3838 + (factor * 140), 8900, 7120],
  ] as const;

  const turnos = [
    ['Almoço', 24.4 + factor, 14280, 3480 + (factor * 120), 8600, 7440],
    ['Jantar', 19.7 + factor, 17740, 3500 + (factor * 130), 9820, 8040],
  ] as const;

  const origens = [
    ['IFOOD', 22.6 + factor, 25180, 5690 + (factor * 190), 14240, 11940],
    ['Retirada Loja', 18.2 + factor, 12870, 2340 + (factor * 130), 7980, 6220],
    ['App Próprio', 28.1 + factor, 9250, 2600 + (factor * 110), 5340, 4710],
  ] as const;

  const totalOfertadas = 18450 + (factor * 740);
  const totalAceitas = 15120 + (factor * 620);
  const totalCompletadas = 14540 + (factor * 600);
  const totalRejeitadas = totalOfertadas - totalAceitas;
  const planned = seconds(32993 + (factor * 42), 56, 40);
  const delivered = seconds(6804 + (factor * 278), 39, 49);

  return {
    total_ofertadas: totalOfertadas,
    total_aceitas: totalAceitas,
    total_completadas: totalCompletadas,
    total_rejeitadas: totalRejeitadas,
    numero_de_pedidos_aceitos_e_concluidos: totalCompletadas,
    aderencia_semanal: [{
      semana: week,
      aderencia_percentual: Number(((delivered / planned) * 100).toFixed(2)),
      segundos_planejados: planned,
      segundos_realizados: delivered,
      total_drivers: 186 + factor,
      total_slots: 780 + factor,
    }],
    aderencia_dia: diasSmoke.map(([dia, diaIso], index) => {
      const dayPlanned = seconds(4200 + (index * 120) + (factor * 12), 20, 0);
      const dayDelivered = seconds(860 + (index * 46) + (factor * 18), 12, 30);
      const ofertadas = 2200 + (index * 120) + (factor * 45);
      const aceitas = 1800 + (index * 90) + (factor * 35);
      return {
        dia,
        dia_semana: dia,
        dia_iso: diaIso,
        aderencia_percentual: Number(((dayDelivered / dayPlanned) * 100).toFixed(2)),
        segundos_planejados: dayPlanned,
        segundos_realizados: dayDelivered,
        corridas_ofertadas: ofertadas,
        corridas_aceitas: aceitas,
        corridas_completadas: aceitas - 40,
        corridas_rejeitadas: ofertadas - aceitas,
        numero_de_pedidos_aceitos_e_concluidos: aceitas - 40,
        taxa_aceitacao: Number(((aceitas / ofertadas) * 100).toFixed(2)),
        taxa_completude: Number((((aceitas - 40) / ofertadas) * 100).toFixed(2)),
      };
    }),
    aderencia_turno: turnos.map(([turno, aderencia, plannedHours, deliveredHours, ofertadas, aceitas]) => ({
      turno,
      aderencia_percentual: Number(aderencia.toFixed(2)),
      segundos_planejados: seconds(plannedHours, 10, 0),
      segundos_realizados: seconds(deliveredHours, 25, 20),
      corridas_ofertadas: ofertadas,
      corridas_aceitas: aceitas,
      corridas_completadas: aceitas - 90,
      corridas_rejeitadas: ofertadas - aceitas,
      numero_de_pedidos_aceitos_e_concluidos: aceitas - 90,
      taxa_aceitacao: Number(((aceitas / ofertadas) * 100).toFixed(2)),
      taxa_completude: Number((((aceitas - 90) / ofertadas) * 100).toFixed(2)),
    })),
    aderencia_sub_praca: subPracas.map(([sub_praca, aderencia, plannedHours, deliveredHours, ofertadas, aceitas]) => ({
      sub_praca,
      aderencia_percentual: Number(aderencia.toFixed(2)),
      segundos_planejados: seconds(plannedHours, 56, 40),
      segundos_realizados: seconds(deliveredHours, 39, 49),
      corridas_ofertadas: ofertadas,
      corridas_aceitas: aceitas,
      corridas_completadas: aceitas - 120,
      corridas_rejeitadas: ofertadas - aceitas,
      numero_de_pedidos_aceitos_e_concluidos: aceitas - 120,
      taxa_aceitacao: Number(((aceitas / ofertadas) * 100).toFixed(2)),
      taxa_completude: Number((((aceitas - 120) / ofertadas) * 100).toFixed(2)),
    })),
    aderencia_origem: origens.map(([origem, aderencia, plannedHours, deliveredHours, ofertadas, aceitas]) => ({
      origem,
      aderencia_percentual: Number(aderencia.toFixed(2)),
      segundos_planejados: seconds(plannedHours, 30, 0),
      segundos_realizados: seconds(deliveredHours, 12, 20),
      corridas_ofertadas: ofertadas,
      corridas_aceitas: aceitas,
      corridas_completadas: aceitas - 80,
      corridas_rejeitadas: ofertadas - aceitas,
      numero_de_pedidos_aceitos_e_concluidos: aceitas - 80,
      taxa_aceitacao: Number(((aceitas / ofertadas) * 100).toFixed(2)),
      taxa_completude: Number((((aceitas - 80) / ofertadas) * 100).toFixed(2)),
    })),
    aderencia_dia_origem: [],
    dimensoes: {
      anos: [2026],
      semanas: semanasSmoke,
      pracas: ['Guarulhos', 'Centro'],
      sub_pracas: subPracas.map(([nome]) => nome),
      origens: origens.map(([nome]) => nome),
      turnos: turnos.map(([nome]) => nome),
    },
    totais: {
      corridas_ofertadas: totalOfertadas,
      corridas_aceitas: totalAceitas,
      corridas_completadas: totalCompletadas,
      corridas_rejeitadas: totalRejeitadas,
      numero_de_pedidos_aceitos_e_concluidos: totalCompletadas,
    },
  };
}

export default function VisualSmokePage() {
  const [mostrarApresentacao, setMostrarApresentacao] = useState(false);
  const [semanasSelecionadas, setSemanasSelecionadas] = useState(semanasSmoke);
  const [pracaSelecionada, setPracaSelecionada] = useState<string | null>('Guarulhos');
  const [viewModeDetalhada, setViewModeDetalhada] = useState<ViewMode>('table');
  const [viewModeDia, setViewModeDia] = useState<ViewMode>('table');
  const [viewModeSubPraca, setViewModeSubPraca] = useState<ViewMode>('table');
  const [viewModeOrigem, setViewModeOrigem] = useState<ViewMode>('table');
  const [secoesVisiveis, setSecoesVisiveis] = useState<SecoesVisiveis>(secoesPadrao);

  const dadosComparacao = useMemo(() => [makeWeekData('2026-W05', 0), makeWeekData('2026-W07', 1)], []);
  const utrComparacao = useMemo(() => [
    {
      semana: '2026-W05',
      utr: {
        geral: {
          aderencia_percentual: 74.8,
          corridas_ofertadas: 12400,
          corridas_aceitas: 10340,
          corridas_completadas: 9950,
          corridas_rejeitadas: 2060,
          taxa_aceitacao: 83.4,
          taxa_completude: 80.2,
        },
      },
    },
    {
      semana: '2026-W07',
      utr: {
        geral: {
          aderencia_percentual: 78.2,
          corridas_ofertadas: 13280,
          corridas_aceitas: 11120,
          corridas_completadas: 10780,
          corridas_rejeitadas: 2160,
          taxa_aceitacao: 83.7,
          taxa_completude: 81.2,
        },
      },
    },
  ], []);

  const origensDisponiveis = useMemo(
    () => Array.from(new Set(dadosComparacao.flatMap((dados) => dados.aderencia_origem.map((item) => item.origem)))).sort(),
    [dadosComparacao]
  );

  const toggleSemana = useCallback((semana: number | string) => {
    const semanaStr = String(semana);
    setSemanasSelecionadas((current) => {
      if (current.includes(semanaStr)) return current.filter((item) => item !== semanaStr);
      if (current.length >= 2) return current;
      return [...current, semanaStr].sort((a, b) => a.localeCompare(b));
    });
  }, []);

  const toggleSecao = useCallback((secao: keyof SecoesVisiveis) => {
    setSecoesVisiveis((current) => ({ ...current, [secao]: !current[secao] }));
  }, []);

  const state = {
    semanasSelecionadas,
    pracaSelecionada,
    mostrarApresentacao,
    viewModeDetalhada,
    viewModeDia,
    viewModeSubPraca,
    viewModeOrigem,
    loading: false,
    error: null,
    shouldDisablePracaFilter: false,
    anoSelecionado: 2026,
    secoesVisiveis,
  };

  const data = {
    dadosComparacao,
    utrComparacao,
    todasSemanas: ['2026-W05', '2026-W06', '2026-W07'],
    origensDisponiveis,
    totalColunasOrigem: 3,
  };

  const actions = {
    setPracaSelecionada,
    setMostrarApresentacao,
    setViewModeDetalhada,
    setViewModeDia,
    setViewModeSubPraca,
    setViewModeOrigem,
    toggleSemana,
    setSemanasSelecionadas,
    limparSemanas: () => setSemanasSelecionadas([]),
    toggleSecao,
  };

  return (
    <main className="min-h-screen bg-slate-100 py-6 dark:bg-slate-950">
      <ComparacaoLayout
        pracas={pracasSmoke}
        state={state}
        data={data}
        actions={actions}
      />
    </main>
  );
}
