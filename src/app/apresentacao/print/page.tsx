import React from 'react';
import { safeRpc } from '@/lib/rpcWrapper';
import { SLIDE_HEIGHT, SLIDE_WIDTH } from '@/components/apresentacao/constants';
import SlideCapa from '@/components/apresentacao/slides/SlideCapa';
import SlideAderenciaGeral from '@/components/apresentacao/slides/SlideAderenciaGeral';
import SlideSubPracas from '@/components/apresentacao/slides/SlideSubPracas';
import SlideAderenciaDiaria from '@/components/apresentacao/slides/SlideAderenciaDiaria';
import SlideTurnos from '@/components/apresentacao/slides/SlideTurnos';
import SlideOrigem from '@/components/apresentacao/slides/SlideOrigem';

// Utilitários de cálculo (adaptados do ApresentacaoView)
const diasOrdem = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const siglaDia = (dia: string) => dia.slice(0, 3).toUpperCase();
const chunkArray = <T,>(array: T[], size: number): T[][] => {
  if (size <= 0) return [array];
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) result.push(array.slice(i, i + size));
  return result;
};

const SUB_PRACAS_PER_PAGE = 4;
const TURNOS_PER_PAGE = 3;
const ORIGENS_PER_PAGE = 4;

const extrairNumeroSemana = (semana: string) => {
  if (semana?.includes('-W')) return semana.split('-W')[1];
  return semana;
};

function formatSigned(percentOrInt: number, suffix = '%') {
  if (!Number.isFinite(percentOrInt) || percentOrInt === 0) return suffix === '%' ? '±0,0%' : '0';
  const sign = percentOrInt > 0 ? '+' : '−';
  const value = Math.abs(percentOrInt);
  if (suffix === '%') {
    return `${sign}${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)}%`;
  }
  return `${sign}${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Math.round(value))}`;
}

function formatHMS(hoursString: string): string {
  // Já está no util do projeto, mas evitamos importar para manter server-friendly
  const parts = String(hoursString).split(':');
  if (parts.length !== 3) return hoursString;
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
}

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: {
    praca?: string;
    sem1?: string; // Ex: 2025-W35 ou 35
    sem2?: string;
  };
}

export default async function PrintablePage({ searchParams }: PageProps) {
  const praca = searchParams.praca || null;
  const s1 = searchParams.sem1 || '';
  const s2 = searchParams.sem2 || '';

  if (!s1 || !s2) {
    return (
      <html>
        <body style={{ background: '#0f172a', color: 'white', padding: 24 }}>
          <h1>Parâmetros faltando</h1>
          <p>Informe sem1, sem2 e opcionalmente praca.</p>
        </body>
      </html>
    );
  }

  // Detectar ano pela string "YYYY-Www" ou usar ano corrente
  const currentYear = new Date().getFullYear();
  const ano1 = /\d{4}-W\d+/.test(s1) ? Number(s1.slice(0, 4)) : currentYear;
  const ano2 = /\d{4}-W\d+/.test(s2) ? Number(s2.slice(0, 4)) : currentYear;
  const semanaNum1 = Number(extrairNumeroSemana(s1) || s1);
  const semanaNum2 = Number(extrairNumeroSemana(s2) || s2);

  const filterBase = (ano: number, semana: number) => ({
    p_ano: ano,
    p_semana: semana,
    p_praca: praca || null,
    p_sub_praca: null,
    p_origem: null,
    p_turno: null,
  });

  // Buscar os dois conjuntos de dados via RPC
  const [semana1Result, semana2Result] = await Promise.all([
    safeRpc('dashboard_resumo', filterBase(ano1, semanaNum1) as any, {
      timeout: 30000,
      validateParams: true
    }),
    safeRpc('dashboard_resumo', filterBase(ano2, semanaNum2) as any, {
      timeout: 30000,
      validateParams: true
    }),
  ]);
  const semana1 = semana1Result.data;
  const semana2 = semana2Result.data;

  // Construir dados dos slides (mesma lógica base do ApresentacaoView)
  const numeroSemana1 = extrairNumeroSemana(String(semanaNum1)) || String(semanaNum1);
  const numeroSemana2 = extrairNumeroSemana(String(semanaNum2)) || String(semanaNum2);

  const aderencia1 = semana1?.semanal?.[0]?.aderencia_percentual || 0;
  const aderencia2 = semana2?.semanal?.[0]?.aderencia_percentual || 0;
  const horasEntregues1 = parseFloat(semana1?.semanal?.[0]?.horas_entregues || '0');
  const horasEntregues2 = parseFloat(semana2?.semanal?.[0]?.horas_entregues || '0');
  const horasPlanejadas1 = parseFloat(semana1?.semanal?.[0]?.horas_a_entregar || '0');
  const horasPlanejadas2 = parseFloat(semana2?.semanal?.[0]?.horas_a_entregar || '0');

  const resumoSemana1 = {
    numeroSemana: numeroSemana1,
    aderencia: aderencia1,
    horasPlanejadas: formatHMS(Math.abs(horasPlanejadas1).toString()),
    horasEntregues: formatHMS(Math.abs(horasEntregues1).toString()),
  };
  const resumoSemana2 = {
    numeroSemana: numeroSemana2,
    aderencia: aderencia2,
    horasPlanejadas: formatHMS(Math.abs(horasPlanejadas2).toString()),
    horasEntregues: formatHMS(Math.abs(horasEntregues2).toString()),
  };
  const variacaoResumo = {
    horasDiferenca: (() => {
      const dif = horasEntregues2 - horasEntregues1;
      const prefix = dif > 0 ? '+' : dif < 0 ? '−' : '';
      return `${prefix}${formatHMS(Math.abs(dif).toString())}`;
    })(),
    horasPercentual: formatSigned(((horasEntregues2 - horasEntregues1) / (horasEntregues1 || 1)) * 100),
    positiva: horasEntregues2 >= horasEntregues1,
  };

  const subPracasSemana1 = semana1?.sub_praca || [];
  const subPracasSemana2 = semana2?.sub_praca || [];
  const subPracasSemana1Map = new Map(subPracasSemana1.map((i: any) => [String(i.sub_praca || '').trim(), i]));
  const subPracasSemana2Map = new Map(subPracasSemana2.map((i: any) => [String(i.sub_praca || '').trim(), i]));
  const todasSubPracas = Array.from(new Set([...subPracasSemana1Map.keys(), ...subPracasSemana2Map.keys()])) as string[];
  todasSubPracas.sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const subPracasComparativo = todasSubPracas.map((nome) => {
    const itemSemana1 = subPracasSemana1Map.get(nome) || ({} as any);
    const itemSemana2 = subPracasSemana2Map.get(nome) || ({} as any);
    const horasPlanejadasBase = parseFloat(itemSemana1?.horas_a_entregar || itemSemana2?.horas_a_entregar || '0');
    const horasSem1 = parseFloat(itemSemana1?.horas_entregues || '0');
    const horasSem2 = parseFloat(itemSemana2?.horas_entregues || '0');
    const aderenciaSem1 = itemSemana1?.aderencia_percentual || 0;
    const aderenciaSem2 = itemSemana2?.aderencia_percentual || 0;

    return {
      nome: nome.toUpperCase(),
      horasPlanejadas: formatHMS(Math.abs(horasPlanejadasBase).toString()),
      semana1: { aderencia: aderenciaSem1, horasEntregues: formatHMS(Math.abs(horasSem1).toString()) },
      semana2: { aderencia: aderenciaSem2, horasEntregues: formatHMS(Math.abs(horasSem2).toString()) },
      variacoes: [
        { label: 'Δ Horas', valor: (() => {
          const dif = horasSem2 - horasSem1;
          const prefix = dif > 0 ? '+' : dif < 0 ? '−' : '';
          return `${prefix}${formatHMS(Math.abs(dif).toString())}`;
        })(), positivo: horasSem2 - horasSem1 >= 0 },
        { label: '% Horas', valor: formatSigned(((horasSem2 - horasSem1) / (horasSem1 || 1)) * 100), positivo: ((horasSem2 - horasSem1) / (horasSem1 || 1)) * 100 >= 0 },
        { label: '% Aderência', valor: formatSigned(((aderenciaSem2 - aderenciaSem1) / (aderenciaSem1 || 1)) * 100), positivo: ((aderenciaSem2 - aderenciaSem1) / (aderenciaSem1 || 1)) * 100 >= 0 },
      ],
    };
  });
  const subPracasPaginas = chunkArray(subPracasComparativo, SUB_PRACAS_PER_PAGE);

  const diasSemana1Map = new Map((semana1?.dia || []).map((d: any) => [d.dia_da_semana, d]));
  const diasSemana2Map = new Map((semana2?.dia || []).map((d: any) => [d.dia_da_semana, d]));

  const semana1Dias = diasOrdem.map((dia) => {
    const info = diasSemana1Map.get(dia) || ({} as any);
    const horas = parseFloat(info?.horas_entregues || '0');
    return { nome: dia, sigla: siglaDia(dia), aderencia: info?.aderencia_percentual || 0, horasEntregues: formatHMS(horas.toString()) };
  });
  const semana2Dias = diasOrdem.map((dia) => {
    const info1 = diasSemana1Map.get(dia) || ({} as any);
    const info2 = diasSemana2Map.get(dia) || ({} as any);
    const horas1 = parseFloat(info1?.horas_entregues || '0');
    const horas2 = parseFloat(info2?.horas_entregues || '0');
    const aderencia1Dia = info1?.aderencia_percentual || 0;
    const aderencia2Dia = info2?.aderencia_percentual || 0;
    const difHoras = horas2 - horas1;
    return {
      nome: dia, sigla: siglaDia(dia), aderencia: aderencia2Dia, horasEntregues: formatHMS(horas2.toString()),
      diferencaHoras: `${difHoras > 0 ? '+' : difHoras < 0 ? '−' : ''}${formatHMS(Math.abs(difHoras).toString())}`,
      diferencaHorasPositiva: difHoras >= 0,
      diferencaPercentualHoras: formatSigned(((horas2 - horas1) / (horas1 || 1)) * 100),
      diferencaPercentualHorasPositiva: ((horas2 - horas1) / (horas1 || 1)) * 100 >= 0,
      diferencaAderencia: formatSigned(((aderencia2Dia - aderencia1Dia) / (aderencia1Dia || 1)) * 100),
      diferencaAderenciaPositiva: ((aderencia2Dia - aderencia1Dia) / (aderencia1Dia || 1)) * 100 >= 0,
    };
  });

  const turnosSemana1 = semana1?.turno || [];
  const turnosSemana2 = semana2?.turno || [];
  const turnosSemana1Map = new Map(turnosSemana1.map((t: any) => [String(t.periodo || '').trim(), t]));
  const turnosSemana2Map = new Map(turnosSemana2.map((t: any) => [String(t.periodo || '').trim(), t]));
  const todosTurnos = Array.from(new Set([...turnosSemana1Map.keys(), ...turnosSemana2Map.keys()])) as string[];
  todosTurnos.sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const turnosComparativo = todosTurnos.map((nomeTurno) => {
    const t1 = turnosSemana1Map.get(nomeTurno) || ({} as any);
    const t2 = turnosSemana2Map.get(nomeTurno) || ({} as any);
    const h1 = parseFloat(t1?.horas_entregues || '0');
    const h2 = parseFloat(t2?.horas_entregues || '0');
    const a1 = t1?.aderencia_percentual || 0;
    const a2 = t2?.aderencia_percentual || 0;
    return {
      nome: nomeTurno.toUpperCase(),
      semana1: { aderencia: a1, horasEntregues: formatHMS(Math.abs(h1).toString()) },
      semana2: { aderencia: a2, horasEntregues: formatHMS(Math.abs(h2).toString()) },
      variacoes: [
        { label: 'Δ Horas', valor: `${h2 - h1 > 0 ? '+' : h2 - h1 < 0 ? '−' : ''}${formatHMS(Math.abs(h2 - h1).toString())}`, positivo: h2 - h1 >= 0 },
        { label: '% Horas', valor: formatSigned(((h2 - h1) / (h1 || 1)) * 100), positivo: ((h2 - h1) / (h1 || 1)) * 100 >= 0 },
        { label: '% Aderência', valor: formatSigned(((a2 - a1) / (a1 || 1)) * 100), positivo: ((a2 - a1) / (a1 || 1)) * 100 >= 0 },
      ],
    };
  });
  const turnosPaginas = chunkArray(turnosComparativo, TURNOS_PER_PAGE);

  const origensSemana1 = semana1?.origem || [];
  const origensSemana2 = semana2?.origem || [];
  const origensSemana1Map = new Map(origensSemana1.map((o: any) => [String(o.origem || '').trim(), o]));
  const origensSemana2Map = new Map(origensSemana2.map((o: any) => [String(o.origem || '').trim(), o]));
  const todasOrigens = Array.from(new Set([...origensSemana1Map.keys(), ...origensSemana2Map.keys()])) as string[];
  todasOrigens.sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const origensComparativo = todasOrigens.map((nome) => {
    const o1 = origensSemana1Map.get(nome) || ({} as any);
    const o2 = origensSemana2Map.get(nome) || ({} as any);
    const horasPlanejadasBase = parseFloat(o1?.horas_a_entregar || o2?.horas_a_entregar || '0');
    const h1 = parseFloat(o1?.horas_entregues || '0');
    const h2 = parseFloat(o2?.horas_entregues || '0');
    const a1 = o1?.aderencia_percentual || 0;
    const a2 = o2?.aderencia_percentual || 0;
    return {
      nome: nome.toUpperCase(),
      horasPlanejadas: formatHMS(Math.abs(horasPlanejadasBase).toString()),
      semana1: { aderencia: a1, horasEntregues: formatHMS(Math.abs(h1).toString()) },
      semana2: { aderencia: a2, horasEntregues: formatHMS(Math.abs(h2).toString()) },
      variacoes: [
        { label: 'Δ Horas', valor: `${h2 - h1 > 0 ? '+' : h2 - h1 < 0 ? '−' : ''}${formatHMS(Math.abs(h2 - h1).toString())}`, positivo: h2 - h1 >= 0 },
        { label: '% Horas', valor: formatSigned(((h2 - h1) / (h1 || 1)) * 100), positivo: ((h2 - h1) / (h1 || 1)) * 100 >= 0 },
        { label: '% Aderência', valor: formatSigned(((a2 - a1) / (a1 || 1)) * 100), positivo: ((a2 - a1) / (a1 || 1)) * 100 >= 0 },
      ],
    };
  });
  const origensPaginas = chunkArray(origensComparativo, ORIGENS_PER_PAGE);

  // Estilos de impressão consistentes (A4 landscape) + quebra por página
  const pageStyle = `
    html, body { margin: 0; padding: 0; }
    @page { size: A4 landscape; margin: 0; }
    body { background: #1e40af; }
    .page {
      width: ${SLIDE_WIDTH}px;
      height: ${SLIDE_HEIGHT}px;
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      color: #ffffff;
      page-break-after: always;
      position: relative;
      overflow: visible;
    }
    /* Neutralizar posicionamento absoluto do SlideWrapper (tailwind absolute inset-0) no modo print */
    .page > .slide {
      position: relative !important;
      inset: auto !important;
      top: auto !important; left: auto !important; right: auto !important; bottom: auto !important;
    }
  `;

  return (
    <html>
      <head>
        <style dangerouslySetInnerHTML={{ __html: pageStyle }} />
      </head>
      <body data-print-ready="true">
        <div className="page">
          <SlideCapa
            isVisible
            pracaSelecionada={praca}
            numeroSemana1={numeroSemana1}
            numeroSemana2={numeroSemana2}
            periodoSemana1={''}
            periodoSemana2={''}
          />
        </div>

        <div className="page">
          <SlideAderenciaGeral isVisible semana1={resumoSemana1} semana2={resumoSemana2} variacao={variacaoResumo} />
        </div>

        <div className="page">
          <SlideAderenciaDiaria
            isVisible
            numeroSemana1={numeroSemana1}
            numeroSemana2={numeroSemana2}
            semana1Dias={semana1Dias}
            semana2Dias={semana2Dias as any}
          />
        </div>

        {turnosPaginas.map((pagina, idx) => (
          <div className="page" key={`turnos-${idx}`}>
            <SlideTurnos
              isVisible
              numeroSemana1={numeroSemana1}
              numeroSemana2={numeroSemana2}
              paginaAtual={idx + 1}
              totalPaginas={turnosPaginas.length}
              itens={pagina as any}
            />
          </div>
        ))}

        {subPracasPaginas.map((pagina, idx) => (
          <div className="page" key={`subpracas-${idx}`}>
            <SlideSubPracas
              isVisible
              numeroSemana1={numeroSemana1}
              numeroSemana2={numeroSemana2}
              paginaAtual={idx + 1}
              totalPaginas={subPracasPaginas.length}
              itens={pagina as any}
            />
          </div>
        ))}

        {origensPaginas.map((pagina, idx) => (
          <div className="page" key={`origens-${idx}`}>
            <SlideOrigem
              isVisible
              numeroSemana1={numeroSemana1}
              numeroSemana2={numeroSemana2}
              paginaAtual={idx + 1}
              totalPaginas={origensPaginas.length}
              itens={pagina as any}
            />
          </div>
        ))}
      </body>
    </html>
  );
}


