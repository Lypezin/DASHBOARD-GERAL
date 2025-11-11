import React, { useRef, useState, useEffect, useMemo } from 'react';
import { DashboardResumoData } from '@/types';
import { formatarHorasParaHMS } from '@/utils/formatters';
// @ts-ignore - jsPDF types não disponíveis
import jsPDF from 'jspdf';
// @ts-ignore - html2canvas types não disponíveis
import html2canvas from 'html2canvas';
import { SLIDE_HEIGHT, SLIDE_WIDTH, slideDimensionsStyle } from './apresentacao/constants';
import SlideCapa from './apresentacao/slides/SlideCapa';
import SlideAderenciaGeral from './apresentacao/slides/SlideAderenciaGeral';
import SlideSubPracas from './apresentacao/slides/SlideSubPracas';
import SlideAderenciaDiaria from './apresentacao/slides/SlideAderenciaDiaria';
import SlideTurnos from './apresentacao/slides/SlideTurnos';
import SlideDemandaRejeicoes from './apresentacao/slides/SlideDemandaRejeicoes';
import SlideOrigem from './apresentacao/slides/SlideOrigem';
import { safeLog } from '@/lib/errorHandler';
import { formatSignedInteger, formatSignedPercent } from './apresentacao/utils';

const IS_DEV = process.env.NODE_ENV === 'development';

const SUB_PRACAS_PER_PAGE = 4;
const TURNOS_PER_PAGE = 3;
const ORIGENS_PER_PAGE = 4;
const diasOrdem = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

const siglaDia = (dia: string) => dia.slice(0, 3).toUpperCase();

const chunkArray = <T,>(array: T[], size: number): T[][] => {
  if (size <= 0) return [array];
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

const formatarNumeroInteiro = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Number.isFinite(valor) ? valor : 0);

const extrairNumeroSemana = (semana: string) => {
  if (semana?.includes('-W')) {
    return semana.split('-W')[1];
  }
  return semana;
};

const calcularPeriodoSemana = (numeroSemana: string) => {
  const semanaNum = parseInt(numeroSemana, 10);
  if (Number.isNaN(semanaNum)) return '';
  const anoAtual = new Date().getFullYear();
  const primeiraSemana = new Date(anoAtual, 0, 1 + (semanaNum - 1) * 7);
  const primeiraDiaSemana = primeiraSemana.getDate() - primeiraSemana.getDay() + 1;
  const inicio = new Date(primeiraSemana.setDate(primeiraDiaSemana));
  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);
  const formatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${formatter.format(inicio)} - ${formatter.format(fim)}`;
};

const calcularDiferenca = (valor1: number, valor2: number) => valor2 - valor1;

const formatarDiferenca = (diferenca: number, isTime: boolean = false) => {
  if (!Number.isFinite(diferenca)) {
    return isTime ? '0:00:00' : '0';
  }

  if (isTime) {
    const horas = Math.abs(diferenca);
    const prefix = diferenca > 0 ? '+' : diferenca < 0 ? '−' : '';
    return `${prefix}${formatarHorasParaHMS(horas.toString())}`;
  }

  if (diferenca === 0) {
    return '0';
  }

  return formatSignedInteger(diferenca);
};

const calcularDiferencaPercentual = (valor1: number, valor2: number) => {
  if (!Number.isFinite(valor1) || valor1 === 0) return 0;
  return ((valor2 - valor1) / valor1) * 100;
};

const formatarDiferencaPercentual = (diferenca: number) => {
  return formatSignedPercent(diferenca);
};

interface ApresentacaoViewProps {
  dadosComparacao: DashboardResumoData[];
  semanasSelecionadas: string[];
  pracaSelecionada: string | null;
  onClose: () => void;
}

const ApresentacaoView: React.FC<ApresentacaoViewProps> = ({
  dadosComparacao,
  semanasSelecionadas,
  pracaSelecionada,
  onClose,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [previewScale, setPreviewScale] = useState(0.5);

  useEffect(() => {
    const calculateScale = () => {
      if (previewContainerRef.current && contentRef.current) {
        const container = previewContainerRef.current.getBoundingClientRect();
        const availableWidth = container.width - 32;
        const availableHeight = container.height - 32;
        const scaleX = availableWidth / SLIDE_WIDTH;
        const scaleY = availableHeight / SLIDE_HEIGHT;
        const scale = Math.min(scaleX, scaleY) * 0.95;
        setPreviewScale(Math.max(0.1, Math.min(1, scale)));
      }
    };

    calculateScale();
    const timeoutId = setTimeout(calculateScale, 100);
    window.addEventListener('resize', calculateScale);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', calculateScale);
    };
  }, [currentSlide, dadosComparacao]);

  const semana1 = dadosComparacao[0];
  const semana2 = dadosComparacao[1];

  const semanaSelecionada1 = semanasSelecionadas[0] ?? '';
  const semanaSelecionada2 = semanasSelecionadas[1] ?? '';
  const numeroSemana1 = extrairNumeroSemana(semanaSelecionada1) || semanaSelecionada1 || '—';
  const numeroSemana2 = extrairNumeroSemana(semanaSelecionada2) || semanaSelecionada2 || '—';

  const aderencia1 = semana1?.semanal?.[0]?.aderencia_percentual || 0;
  const aderencia2 = semana2?.semanal?.[0]?.aderencia_percentual || 0;
  const horasEntregues1 = parseFloat(semana1?.semanal?.[0]?.horas_entregues || '0');
  const horasEntregues2 = parseFloat(semana2?.semanal?.[0]?.horas_entregues || '0');
  const horasPlanejadas1 = parseFloat(semana1?.semanal?.[0]?.horas_a_entregar || '0');
  const horasPlanejadas2 = parseFloat(semana2?.semanal?.[0]?.horas_a_entregar || '0');

  const periodoSemana1 = useMemo(() => calcularPeriodoSemana(numeroSemana1), [numeroSemana1]);
  const periodoSemana2 = useMemo(() => calcularPeriodoSemana(numeroSemana2), [numeroSemana2]);

  const slides = useMemo(() => {
    if (!semana1 || !semana2) {
      safeLog.warn('ApresentacaoView: dados insuficientes para gerar slides', {
        total: dadosComparacao.length,
      });
      return [] as Array<{ key: string; render: (visible: boolean) => React.ReactNode }>;
    }

    const slidesConfig: Array<{ key: string; render: (visible: boolean) => React.ReactNode }> = [];

    const resumoSemana1 = {
      numeroSemana: numeroSemana1,
      aderencia: aderencia1,
      horasPlanejadas: formatarHorasParaHMS(Math.abs(horasPlanejadas1).toString()),
      horasEntregues: formatarHorasParaHMS(Math.abs(horasEntregues1).toString()),
    };

    const resumoSemana2 = {
      numeroSemana: numeroSemana2,
      aderencia: aderencia2,
      horasPlanejadas: formatarHorasParaHMS(Math.abs(horasPlanejadas2).toString()),
      horasEntregues: formatarHorasParaHMS(Math.abs(horasEntregues2).toString()),
    };

    const variacaoResumo = {
      horasDiferenca: formatarDiferenca(calcularDiferenca(horasEntregues1, horasEntregues2), true),
      horasPercentual: formatarDiferencaPercentual(calcularDiferencaPercentual(horasEntregues1, horasEntregues2)),
      positiva: horasEntregues2 >= horasEntregues1,
    };

    slidesConfig.push({
      key: 'capa',
      render: (visible) => (
        <SlideCapa
          isVisible={visible}
          pracaSelecionada={pracaSelecionada}
          numeroSemana1={numeroSemana1}
          numeroSemana2={numeroSemana2}
          periodoSemana1={periodoSemana1}
          periodoSemana2={periodoSemana2}
        />
      ),
    });

    slidesConfig.push({
      key: 'aderencia-geral',
      render: (visible) => (
        <SlideAderenciaGeral
          isVisible={visible}
          semana1={resumoSemana1}
          semana2={resumoSemana2}
          variacao={variacaoResumo}
        />
      ),
    });

    const subPracasSemana1 = semana1.sub_praca || [];
    const subPracasSemana2 = semana2.sub_praca || [];
    const subPracasSemana1Map = new Map(
      subPracasSemana1.map((item) => [(item.sub_praca || '').trim(), item])
    );
    const subPracasSemana2Map = new Map(
      subPracasSemana2.map((item) => [(item.sub_praca || '').trim(), item])
    );

    const todasSubPracas = Array.from(
      new Set([...subPracasSemana1Map.keys(), ...subPracasSemana2Map.keys()])
    )
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    const subPracasComparativo = todasSubPracas.map((nome) => {
      const itemSemana1 = subPracasSemana1Map.get(nome) || ({} as any);
      const itemSemana2 = subPracasSemana2Map.get(nome) || ({} as any);
      const horasPlanejadasBase = parseFloat(
        itemSemana1?.horas_a_entregar || itemSemana2?.horas_a_entregar || '0'
      );
      const horasSem1 = parseFloat(itemSemana1?.horas_entregues || '0');
      const horasSem2 = parseFloat(itemSemana2?.horas_entregues || '0');
      const aderenciaSem1 = itemSemana1?.aderencia_percentual || 0;
      const aderenciaSem2 = itemSemana2?.aderencia_percentual || 0;

      const diffHoras = calcularDiferenca(horasSem1, horasSem2);
      const diffHorasPercent = calcularDiferencaPercentual(horasSem1, horasSem2);
      const diffAderenciaPercent = calcularDiferencaPercentual(aderenciaSem1, aderenciaSem2);

      return {
        nome: nome.toUpperCase(),
        horasPlanejadas: formatarHorasParaHMS(Math.abs(horasPlanejadasBase).toString()),
        semana1: {
          aderencia: aderenciaSem1,
          horasEntregues: formatarHorasParaHMS(Math.abs(horasSem1).toString()),
        },
        semana2: {
          aderencia: aderenciaSem2,
          horasEntregues: formatarHorasParaHMS(Math.abs(horasSem2).toString()),
        },
        variacoes: [
          {
            label: 'Δ Horas',
            valor: formatarDiferenca(diffHoras, true),
            positivo: diffHoras >= 0,
          },
          {
            label: '% Horas',
            valor: formatarDiferencaPercentual(diffHorasPercent),
            positivo: diffHorasPercent >= 0,
          },
          {
            label: '% Aderência',
            valor: formatarDiferencaPercentual(diffAderenciaPercent),
            positivo: diffAderenciaPercent >= 0,
          },
        ],
      };
    });

    const subPracasPaginas = chunkArray(subPracasComparativo, SUB_PRACAS_PER_PAGE);
    subPracasPaginas.forEach((pagina, indice) => {
      slidesConfig.push({
        key: `sub-pracas-${indice}`,
        render: (visible) => (
          <SlideSubPracas
            isVisible={visible}
            numeroSemana1={numeroSemana1}
            numeroSemana2={numeroSemana2}
            paginaAtual={indice + 1}
            totalPaginas={subPracasPaginas.length}
            itens={pagina}
          />
        ),
      });
    });

    const diasSemana1Map = new Map((semana1.dia || []).map((item) => [item.dia_da_semana, item]));
    const diasSemana2Map = new Map((semana2.dia || []).map((item) => [item.dia_da_semana, item]));

    const semana1Dias = diasOrdem.map((dia) => {
      const info = diasSemana1Map.get(dia) || ({} as any);
      const horas = parseFloat(info?.horas_entregues || '0');
      return {
        nome: dia,
        sigla: siglaDia(dia),
        aderencia: info?.aderencia_percentual || 0,
        horasEntregues: formatarHorasParaHMS(horas.toString()),
      };
    });

    const semana2Dias = diasOrdem.map((dia) => {
      const info1 = diasSemana1Map.get(dia) || ({} as any);
      const info2 = diasSemana2Map.get(dia) || ({} as any);
      const horas1 = parseFloat(info1?.horas_entregues || '0');
      const horas2 = parseFloat(info2?.horas_entregues || '0');
      const aderencia1Dia = info1?.aderencia_percentual || 0;
      const aderencia2Dia = info2?.aderencia_percentual || 0;
      return {
        nome: dia,
        sigla: siglaDia(dia),
        aderencia: aderencia2Dia,
        horasEntregues: formatarHorasParaHMS(horas2.toString()),
        diferencaHoras: formatarDiferenca(calcularDiferenca(horas1, horas2), true),
        diferencaHorasPositiva: horas2 - horas1 >= 0,
        diferencaPercentualHoras: formatarDiferencaPercentual(calcularDiferencaPercentual(horas1, horas2)),
        diferencaPercentualHorasPositiva: calcularDiferencaPercentual(horas1, horas2) >= 0,
        diferencaAderencia: formatarDiferencaPercentual(calcularDiferencaPercentual(aderencia1Dia || 0.0001, aderencia2Dia || 0)),
        diferencaAderenciaPositiva: calcularDiferencaPercentual(aderencia1Dia || 0.0001, aderencia2Dia || 0) >= 0,
      };
    });

    slidesConfig.push({
      key: 'aderencia-diaria',
      render: (visible) => (
        <SlideAderenciaDiaria
          isVisible={visible}
          numeroSemana1={numeroSemana1}
          numeroSemana2={numeroSemana2}
          semana1Dias={semana1Dias}
          semana2Dias={semana2Dias}
        />
      ),
    });

    const turnosSemana1 = semana1.turno || [];
    const turnosSemana2 = semana2.turno || [];
    const turnosSemana1Map = new Map(
      turnosSemana1.map((turno) => [(turno.periodo || '').trim(), turno])
    );
    const turnosSemana2Map = new Map(
      turnosSemana2.map((turno) => [(turno.periodo || '').trim(), turno])
    );

    const todosTurnos = Array.from(
      new Set([...turnosSemana1Map.keys(), ...turnosSemana2Map.keys()])
    )
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    const turnosComparativo = todosTurnos.map((nomeTurno) => {
      const turnoSemana1 = turnosSemana1Map.get(nomeTurno) || ({} as any);
      const turnoSemana2 = turnosSemana2Map.get(nomeTurno) || ({} as any);
      const horasSem1 = parseFloat(turnoSemana1?.horas_entregues || '0');
      const horasSem2 = parseFloat(turnoSemana2?.horas_entregues || '0');
      const aderenciaSem1 = turnoSemana1?.aderencia_percentual || 0;
      const aderenciaSem2 = turnoSemana2?.aderencia_percentual || 0;

      const diffHoras = calcularDiferenca(horasSem1, horasSem2);
      const diffHorasPercent = calcularDiferencaPercentual(horasSem1, horasSem2);
      const diffAderenciaPercent = calcularDiferencaPercentual(aderenciaSem1, aderenciaSem2);

      return {
        nome: nomeTurno.toUpperCase(),
        semana1: {
          aderencia: aderenciaSem1,
          horasEntregues: formatarHorasParaHMS(Math.abs(horasSem1).toString()),
        },
        semana2: {
          aderencia: aderenciaSem2,
          horasEntregues: formatarHorasParaHMS(Math.abs(horasSem2).toString()),
        },
        variacoes: [
          {
            label: 'Δ Horas',
            valor: formatarDiferenca(diffHoras, true),
            positivo: diffHoras >= 0,
          },
          {
            label: '% Horas',
            valor: formatarDiferencaPercentual(diffHorasPercent),
            positivo: diffHorasPercent >= 0,
          },
          {
            label: '% Aderência',
            valor: formatarDiferencaPercentual(diffAderenciaPercent),
            positivo: diffAderenciaPercent >= 0,
          },
        ],
      };
    });

    const turnosPaginas = chunkArray(turnosComparativo, TURNOS_PER_PAGE);
    turnosPaginas.forEach((pagina, indice) => {
      slidesConfig.push({
        key: `turnos-${indice}`,
        render: (visible) => (
          <SlideTurnos
            isVisible={visible}
            numeroSemana1={numeroSemana1}
            numeroSemana2={numeroSemana2}
            paginaAtual={indice + 1}
            totalPaginas={turnosPaginas.length}
            itens={pagina}
          />
        ),
      });
    });

    const origensSemana1 = semana1.origem || [];
    const origensSemana2 = semana2.origem || [];
    const origensSemana1Map = new Map(
      origensSemana1.map((item) => [(item.origem || '').trim(), item])
    );
    const origensSemana2Map = new Map(
      origensSemana2.map((item) => [(item.origem || '').trim(), item])
    );

    const todasOrigens = Array.from(
      new Set([...origensSemana1Map.keys(), ...origensSemana2Map.keys()])
    )
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    const origensComparativo = todasOrigens.map((origemNome) => {
      const origemSemana1 = origensSemana1Map.get(origemNome) || ({} as any);
      const origemSemana2 = origensSemana2Map.get(origemNome) || ({} as any);
      const horasPlanejadasBase = parseFloat(
        origemSemana1?.horas_a_entregar || origemSemana2?.horas_a_entregar || '0'
      );
      const horasSem1 = parseFloat(origemSemana1?.horas_entregues || '0');
      const horasSem2 = parseFloat(origemSemana2?.horas_entregues || '0');
      const aderenciaSem1 = origemSemana1?.aderencia_percentual || 0;
      const aderenciaSem2 = origemSemana2?.aderencia_percentual || 0;

      const diffHoras = calcularDiferenca(horasSem1, horasSem2);
      const diffHorasPercent = calcularDiferencaPercentual(horasSem1, horasSem2);
      const diffAderenciaPercent = calcularDiferencaPercentual(aderenciaSem1, aderenciaSem2);

      return {
        nome: origemNome.toUpperCase(),
        horasPlanejadas: formatarHorasParaHMS(Math.abs(horasPlanejadasBase).toString()),
        semana1: {
          aderencia: aderenciaSem1,
          horasEntregues: formatarHorasParaHMS(Math.abs(horasSem1).toString()),
        },
        semana2: {
          aderencia: aderenciaSem2,
          horasEntregues: formatarHorasParaHMS(Math.abs(horasSem2).toString()),
        },
        variacoes: [
          {
            label: 'Δ Horas',
            valor: formatarDiferenca(diffHoras, true),
            positivo: diffHoras >= 0,
          },
          {
            label: '% Horas',
            valor: formatarDiferencaPercentual(diffHorasPercent),
            positivo: diffHorasPercent >= 0,
          },
          {
            label: '% Aderência',
            valor: formatarDiferencaPercentual(diffAderenciaPercent),
            positivo: diffAderenciaPercent >= 0,
          },
        ],
      };
    });

    const origensPaginas = chunkArray(origensComparativo, ORIGENS_PER_PAGE);
    origensPaginas.forEach((pagina, indice) => {
      slidesConfig.push({
        key: `origens-${indice}`,
        render: (visible) => (
          <SlideOrigem
            isVisible={visible}
            numeroSemana1={numeroSemana1}
            numeroSemana2={numeroSemana2}
            paginaAtual={indice + 1}
            totalPaginas={origensPaginas.length}
            itens={pagina}
          />
        ),
      });
    });

    const totaisSemana1 = semana1.totais || {};
    const totaisSemana2 = semana2.totais || {};

    const demandaItens = [
      {
        label: 'Ofertadas',
        icone: '📦',
        valor1: Number(totaisSemana1.corridas_ofertadas || 0),
        valor2: Number(totaisSemana2.corridas_ofertadas || 0),
      },
      {
        label: 'Aceitas',
        icone: '🤝',
        valor1: Number(totaisSemana1.corridas_aceitas || 0),
        valor2: Number(totaisSemana2.corridas_aceitas || 0),
      },
      {
        label: 'Completadas',
        icone: '🏁',
        valor1: Number(totaisSemana1.corridas_completadas || 0),
        valor2: Number(totaisSemana2.corridas_completadas || 0),
      },
      {
        label: 'Rejeitadas',
        icone: '⛔',
        valor1: Number(totaisSemana1.corridas_rejeitadas || 0),
        valor2: Number(totaisSemana2.corridas_rejeitadas || 0),
      },
    ].map((item) => {
      const diffValor = calcularDiferenca(item.valor1, item.valor2);
      const diffPercent = calcularDiferencaPercentual(item.valor1 || 0.0001, item.valor2 || 0);
      return {
        label: item.label,
        icone: item.icone,
        semana1Valor: formatarNumeroInteiro(item.valor1),
        semana2Valor: formatarNumeroInteiro(item.valor2),
        variacaoValor: formatarDiferenca(diffValor),
        variacaoPositiva: diffValor >= 0,
        variacaoPercentual: formatarDiferencaPercentual(diffPercent),
        variacaoPercentualPositiva: diffPercent >= 0,
      };
    });

    slidesConfig.push({
      key: 'demanda',
      render: (visible) => (
        <SlideDemandaRejeicoes
          isVisible={visible}
          numeroSemana1={numeroSemana1}
          numeroSemana2={numeroSemana2}
          itens={demandaItens}
        />
      ),
    });

    return slidesConfig;
  }, [
    semana1,
    semana2,
    numeroSemana1,
    numeroSemana2,
    aderencia1,
    aderencia2,
    horasEntregues1,
    horasEntregues2,
    horasPlanejadas1,
    horasPlanejadas2,
    periodoSemana1,
    periodoSemana2,
    pracaSelecionada,
    dadosComparacao.length,
  ]);

  useEffect(() => {
    setCurrentSlide((prev) => {
      if (slides.length === 0) return 0;
      return Math.min(prev, slides.length - 1);
    });
  }, [slides.length]);

  const gerarPDF = async () => {
    if (!contentRef.current) return;
    setIsGenerating(true);

    try {
      // Aguarda fontes carregarem para evitar glifos estranhos no canvas
      try {
        // @ts-ignore
        if (document?.fonts?.ready) {
          // @ts-ignore
          await document.fonts.ready;
        }
      } catch (_err) {
        // ignore
      }

      // Criar PDF em landscape A4 SEM MARGENS para eliminar bordas brancas
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const elementos = contentRef.current.querySelectorAll('.slide');

      // Container invisível para renderização (fora da tela)
      const renderContainer = document.createElement('div');
      renderContainer.style.cssText = `
        position: absolute;
        left: -99999px;
        top: -99999px;
        width: ${SLIDE_WIDTH}px;
        height: ${SLIDE_HEIGHT}px;
        margin: 0;
        padding: 0;
        background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
        font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        box-sizing: border-box;
        overflow: visible;
        pointer-events: none;
      `;
      document.body.appendChild(renderContainer);

      for (let i = 0; i < elementos.length; i++) {
        const slide = elementos[i] as HTMLElement;

        // Clonar o slide profundamente
        const clone = slide.cloneNode(true) as HTMLElement;
        
        // Remover classes que podem interferir
        clone.className = clone.className.replace(/opacity-\d+|hidden|invisible/g, '').trim();
        
        // Aplicar estilos críticos para renderização perfeita
        clone.style.cssText = `
          position: relative !important;
          width: ${SLIDE_WIDTH}px !important;
          height: ${SLIDE_HEIGHT}px !important;
          margin: 0 !important;
          padding: 0 !important;
          opacity: 1 !important;
          visibility: visible !important;
          display: flex !important;
          flex-direction: column !important;
          transform: none !important;
          transform-origin: top left !important;
          overflow: visible !important;
          box-sizing: border-box !important;
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%) !important;
          color: #ffffff !important;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
          contain: none !important;
        `;

        // Otimização ULTRA DEFINITIVA de elementos para PDF perfeito
        const processElement = (el: any) => {
          if (!el.style || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
          
          // 1. VISIBILIDADE FORÇADA
          el.style.setProperty('opacity', '1', 'important');
          el.style.setProperty('visibility', 'visible', 'important');
          el.style.setProperty('display', el.style.display === 'none' ? 'flex' : el.style.display || 'flex', 'important');
          
          // 2. REMOVER TRANSFORMS PROBLEMÁTICOS
          if (el.style.transform && (el.style.transform.includes('scale') || el.style.transform.includes('rotate'))) {
            // Manter apenas translate, remover scale e rotate
            const translateMatch = el.style.transform.match(/translate\([^)]*\)/);
            if (translateMatch) {
              el.style.setProperty('transform', translateMatch[0], 'important');
            } else {
              el.style.setProperty('transform', 'none', 'important');
            }
          }
          
          // 3. OVERFLOW SEMPRE VISÍVEL (crítico para gráficos)
          el.style.setProperty('overflow', 'visible', 'important');
          el.style.setProperty('text-overflow', 'clip', 'important');
          // permitir que textos longos quebrem corretamente
          el.style.setProperty('white-space', 'normal', 'important');
          el.style.setProperty('word-break', 'break-word', 'important');
          el.style.setProperty('contain', 'none', 'important');
          
          // 4. FONTE E RENDERIZAÇÃO OTIMIZADA
          if (el.tagName === 'SPAN' || el.tagName === 'P' || el.tagName === 'DIV' || el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3') {
            el.style.setProperty('font-family', 'Inter, Arial, sans-serif', 'important');
            el.style.setProperty('-webkit-font-smoothing', 'antialiased', 'important');
            el.style.setProperty('-moz-osx-font-smoothing', 'grayscale', 'important');
            el.style.setProperty('color', '#ffffff', 'important');
            el.style.setProperty('text-rendering', 'optimizeLegibility', 'important');
            el.style.setProperty('word-break', 'keep-all', 'important');
            el.style.setProperty('hyphens', 'none', 'important');
          }
          
          // 5. SVG OTIMIZAÇÃO
          if (el.tagName === 'SVG' || el.tagName === 'CIRCLE' || el.tagName === 'PATH') {
            el.style.setProperty('opacity', '1', 'important');
            el.style.setProperty('visibility', 'visible', 'important');
            el.style.setProperty('overflow', 'visible', 'important');
          }
          
          // 6. CONTAINERS DE GRÁFICOS - ULTRA CRÍTICO
          if (el.classList && (el.classList.contains('relative') || el.classList.contains('absolute'))) {
            el.style.setProperty('overflow', 'visible', 'important');
            el.style.setProperty('position', el.classList.contains('absolute') ? 'absolute' : 'relative', 'important');
            
            // Se tem dimensões definidas, garantir que não corte
            if (el.style.width && el.style.height) {
              el.style.setProperty('min-width', el.style.width, 'important');
              el.style.setProperty('min-height', el.style.height, 'important');
            }
          }
          
          // 7. CONTAINERS DE TEXTO EM CÍRCULOS - ESPECIAL
          if (el.classList && el.classList.contains('absolute') && 
              el.querySelector && el.querySelector('span')) {
            el.style.setProperty('display', 'flex', 'important');
            el.style.setProperty('align-items', 'center', 'important');
            el.style.setProperty('justify-content', 'center', 'important');
            el.style.setProperty('overflow', 'visible', 'important');
          }
        };

        // Processar elemento raiz
        processElement(clone);
        
        // Processar todos os filhos
        const allElements = clone.querySelectorAll('*');
        allElements.forEach(processElement);

        // Adicionar ao container invisível
        renderContainer.appendChild(clone);

        // Aguardar renderização e fontes
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Configuração ULTRA PRECISA do html2canvas
        const canvasOptions = {
          scale: 2, // Escala otimizada para precisão
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#2563eb',
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          windowWidth: SLIDE_WIDTH,
          windowHeight: SLIDE_HEIGHT,
          logging: false,
          imageTimeout: 0,
          removeContainer: false,
          foreignObjectRendering: false,
          scrollX: 0,
          scrollY: 0,
          x: 0,
          y: 0,
          // Configurações extras para precisão
          pixelRatio: 1, // Força ratio 1:1
          dpi: 96, // DPI padrão
          letterRendering: true, // Renderização precisa de texto
          onclone: (clonedDoc: Document, clonedElement: HTMLElement) => {
            // Garantir que o elemento clonado também tenha overflow visible
            if (clonedElement) {
              clonedElement.style.setProperty('overflow', 'visible', 'important');
              clonedElement.style.setProperty('contain', 'none', 'important');
            }
            // Injetar CSS ULTRA OTIMIZADO para renderização perfeita
            const style = clonedDoc.createElement('style');
            style.textContent = `
              * {
                font-family: Inter, Arial, sans-serif !important;
                -webkit-font-smoothing: antialiased !important;
                -moz-osx-font-smoothing: grayscale !important;
                text-rendering: optimizeLegibility !important;
                box-sizing: border-box !important;
                overflow: visible !important;
                text-overflow: clip !important;
                word-break: break-word !important;
                hyphens: auto !important;
                white-space: normal !important;
                contain: none !important;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: ${SLIDE_WIDTH}px !important;
                height: ${SLIDE_HEIGHT}px !important;
                overflow: visible !important;
                background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%) !important;
                contain: none !important;
              }
              body > *, div, span, p, h1, h2, h3, svg, circle, path {
                opacity: 1 !important;
                visibility: visible !important;
                overflow: visible !important;
                text-overflow: clip !important;
                contain: none !important;
              }
              .relative, .absolute {
                overflow: visible !important;
                position: relative !important;
                contain: none !important;
              }
              .absolute {
                position: absolute !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                contain: none !important;
              }
              span {
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                text-align: center !important;
                color: #ffffff !important;
                font-weight: 900 !important;
                contain: none !important;
              }
            `;
            clonedDoc.head.appendChild(style);
            
            // Aplicar otimizações ULTRA ESPECÍFICAS em TODOS os elementos
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach((el: any) => {
              if (el.style) {
                el.style.setProperty('opacity', '1', 'important');
                el.style.setProperty('visibility', 'visible', 'important');
                el.style.setProperty('overflow', 'visible', 'important');
                el.style.setProperty('text-overflow', 'clip', 'important');
                el.style.setProperty('contain', 'none', 'important');
                
                // Textos sempre visíveis e centralizados
                if (el.tagName === 'SPAN' || el.tagName === 'P' || el.tagName === 'DIV') {
                  el.style.setProperty('color', '#ffffff', 'important');
                  el.style.setProperty('font-family', 'Inter, Arial, sans-serif', 'important');
                  el.style.setProperty('display', 'flex', 'important');
                  el.style.setProperty('align-items', 'center', 'important');
                  el.style.setProperty('justify-content', 'center', 'important');
                  el.style.setProperty('text-align', 'center', 'important');
                  el.style.setProperty('word-break', 'keep-all', 'important');
                }
                
                // Containers absolutos sempre centralizados
                if (el.classList && el.classList.contains('absolute')) {
                  el.style.setProperty('display', 'flex', 'important');
                  el.style.setProperty('align-items', 'center', 'important');
                  el.style.setProperty('justify-content', 'center', 'important');
                }
              }
            });
          },
          ignoreElements: (element: Element) => {
            return element.tagName === 'IFRAME' || element.tagName === 'OBJECT' || element.tagName === 'SCRIPT';
          },
        };

        // Captura com html2canvas OTIMIZADO
        let canvas: HTMLCanvasElement | null = null;
        try {
          canvas = await html2canvas(clone, canvasOptions);
        } catch (err) {
          safeLog.error('Erro na captura html2canvas:', err);
          // Tentar com configuração mais simples
          try {
            canvas = await html2canvas(clone, {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#2563eb',
              width: SLIDE_WIDTH,
              height: SLIDE_HEIGHT,
              logging: false,
            });
          } catch (err2) {
            safeLog.error('Fallback html2canvas falhou:', err2);
            continue; // Pular este slide
          }
        }

        // Limpar container
        try {
          renderContainer.removeChild(clone);
        } catch (_e) {}

        if (!canvas) {
          continue; // Pular slide se falhou
        }

        // Canvas final com dimensões EXATAS para precisão máxima
        const finalCanvas = document.createElement('canvas');
        const scale = 2; // Mesma escala do html2canvas
        finalCanvas.width = SLIDE_WIDTH * scale;
        finalCanvas.height = SLIDE_HEIGHT * scale;
        const ctx = finalCanvas.getContext('2d');
        
        if (ctx) {
          // Configurações de renderização de alta qualidade
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Background gradiente IDÊNTICO ao preview
          const gradient = ctx.createLinearGradient(0, 0, finalCanvas.width, finalCanvas.height);
          gradient.addColorStop(0, '#2563eb');
          gradient.addColorStop(1, '#1e40af');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
          
          // Desenhar canvas capturado com precisão máxima
          ctx.drawImage(canvas, 0, 0, finalCanvas.width, finalCanvas.height);
        }

        // PNG de alta qualidade
        const imgData = finalCanvas.toDataURL('image/png', 1.0);

        if (i > 0) {
          pdf.addPage();
        }

        // Adicionar imagem OCUPANDO TODA A PÁGINA (sem margens para eliminar bordas brancas)
        pdf.addImage(
          imgData,
          'PNG',
          0, // X = 0 (sem margem)
          0, // Y = 0 (sem margem)
          pdfWidth, // Largura total da página
          pdfHeight, // Altura total da página
          undefined,
          'FAST'
        );
      }

      // Limpar container invisível
      try {
        document.body.removeChild(renderContainer);
      } catch (_e) {}

      // Download FORÇADO (não abre em nova aba)
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Relatorio_Semanas_${numeroSemana1}_${numeroSemana2}.pdf`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      safeLog.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
      
      // Limpar container em caso de erro
      try {
        const container = document.body.querySelector('[style*="-99999px"]');
        if (container) document.body.removeChild(container);
      } catch (_e) {}
    } finally {
      setIsGenerating(false);
    }
  };

  const goToNextSlide = () => {
    setCurrentSlide((prev) => {
      if (slides.length === 0) return 0;
      return Math.min(prev + 1, slides.length - 1);
    });
  };

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => {
      if (slides.length === 0) return 0;
      return Math.max(prev - 1, 0);
    });
  };

  const totalSlides = slides.length;
  const slideAtualExibicao = totalSlides > 0 ? currentSlide + 1 : 0;

  return (
    <>
      {/* CSS Global para sincronizar preview com PDF */}
      <style>{`
        .slide * {
          font-family: Inter, Arial, sans-serif !important;
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
          text-rendering: optimizeLegibility !important;
          box-sizing: border-box !important;
        }
        .slide .absolute {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .slide span {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-align: center !important;
          word-break: break-word !important;
          white-space: normal !important;
        }
      `}</style>
      
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {isGenerating && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50">
          <svg className="animate-spin h-16 w-16 text-white mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h2 className="text-white text-2xl font-bold">Gerando PDF, por favor aguarde...</h2>
          <p className="text-white text-lg mt-2">Isso pode levar alguns segundos.</p>
        </div>
      )}
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full h-[95vh] flex flex-col">
        <div className="sticky top-0 bg-white p-4 border-b border-slate-200 flex justify-between items-center z-10">
          <h3 className="text-xl font-bold text-slate-800">Preview da Apresentação</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevSlide}
                disabled={currentSlide === 0 || totalSlides === 0}
                className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg shadow-sm hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-slate-600 font-medium text-sm">
                {slideAtualExibicao} / {totalSlides}
              </span>
              <button
                onClick={goToNextSlide}
                disabled={totalSlides === 0 || currentSlide === totalSlides - 1}
                className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg shadow-sm hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            </div>
            <div className="h-6 w-px bg-slate-300"></div>
            <button
              onClick={async () => {
                if (!semanasSelecionadas?.[0] || !semanasSelecionadas?.[1]) return;
                try {
                  setIsGenerating(true);
                  const url = new URL(window.location.origin + '/apresentacao/print');
                  url.searchParams.set('sem1', semanasSelecionadas[0]);
                  url.searchParams.set('sem2', semanasSelecionadas[1]);
                  if (pracaSelecionada) url.searchParams.set('praca', pracaSelecionada);

                  const exportUrl = new URL(window.location.origin + '/api/export-pdf');
                  exportUrl.searchParams.set('url', url.pathname + '?' + url.searchParams.toString());

                  const res = await fetch(exportUrl.toString(), { method: 'GET' });
                  if (!res.ok) {
                    let details = '';
                    try {
                      const txt = await res.text();
                      details = txt;
                    } catch {}
                    throw new Error(details || 'Falha ao gerar PDF pelo servidor.');
                  }
                  const blob = await res.blob();
                  const objUrl = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = objUrl;
                  a.download = `Relatorio_Semanas_${numeroSemana1}_${numeroSemana2}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(objUrl);
                } catch (e) {
                  safeLog.error('Erro ao exportar pelo servidor:', e);
                  const msg = (e as Error)?.message || 'Erro ao gerar PDF pelo servidor. Tente novamente.';
                  alert(msg);
                } finally {
                  setIsGenerating(false);
                }
              }}
              disabled={totalSlides === 0 || isGenerating || !semanasSelecionadas?.[0] || !semanasSelecionadas?.[1]}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg shadow-md hover:bg-emerald-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-3 min-w-[180px] justify-center"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Gerando...</span>
                </>
              ) : (
                <>
                  <span>🖨️</span>
                  <span>Exportar PDF (Servidor)</span>
                </>
              )}
            </button>
            <button
              onClick={gerarPDF}
              disabled={totalSlides === 0 || isGenerating}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-3 min-w-[140px] justify-center"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Gerando...</span>
                </>
              ) : (
                <>
                  <span>📄</span>
                  <span>Gerar PDF</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg shadow-md hover:bg-slate-300 transition-colors"
            >
              ✕ Fechar
            </button>
          </div>
        </div>

        <div
          ref={previewContainerRef}
          className="bg-slate-100 flex-1 overflow-hidden p-4"
          style={{ position: 'relative' }}
        >
          <div
            ref={contentRef}
            className="relative"
            style={{
              ...slideDimensionsStyle,
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scale(${previewScale})`,
              transformOrigin: 'center center',
              // Forçar estilos idênticos ao PDF
              fontFamily: 'Inter, Arial, sans-serif',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              textRendering: 'optimizeLegibility',
            }}
          >
            {totalSlides === 0 ? (
              <div
                className="slide bg-gradient-to-br from-blue-600 to-blue-800 text-white absolute inset-0 flex items-center justify-center text-4xl font-semibold"
                style={slideDimensionsStyle}
              >
                Nenhum dado disponível.
              </div>
            ) : (
              slides.map((slide, index) => (
                <React.Fragment key={slide.key}>
                  {slide.render(currentSlide === index)}
                </React.Fragment>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Overlay de carregamento */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]">
          <div className="bg-white rounded-xl p-8 shadow-2xl flex flex-col items-center gap-6 max-w-sm mx-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Gerando PDF
              </h3>
              <p className="text-sm text-gray-600">
                Processando slides e otimizando qualidade...
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Aguarde, não feche esta janela
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default ApresentacaoView;