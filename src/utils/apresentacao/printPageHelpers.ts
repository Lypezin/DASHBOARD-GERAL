/**
 * Funções auxiliares para página de impressão
 * Extraído de src/app/apresentacao/print/page.tsx
 */

import { SLIDE_HEIGHT, SLIDE_WIDTH } from '@/components/apresentacao/constants';
import { extrairNumeroSemana } from './printHelpers';

export interface PrintPageParams {
  praca?: string;
  sem1?: string;
  sem2?: string;
}

export interface ParsedPrintParams {
  praca: string | null;
  ano1: number;
  ano2: number;
  semanaNum1: number;
  semanaNum2: number;
  numeroSemana1: string;
  numeroSemana2: string;
}

/**
 * Parse e valida parâmetros da página de impressão
 */
export function parsePrintParams(searchParams: PrintPageParams): ParsedPrintParams | null {
  const praca = searchParams.praca || null;
  const s1 = searchParams.sem1 || '';
  const s2 = searchParams.sem2 || '';

  if (!s1 || !s2) {
    return null;
  }

  const currentYear = new Date().getFullYear();
  const ano1 = /\d{4}-W\d+/.test(s1) ? Number(s1.slice(0, 4)) : currentYear;
  const ano2 = /\d{4}-W\d+/.test(s2) ? Number(s2.slice(0, 4)) : currentYear;
  const semanaNum1 = Number(extrairNumeroSemana(s1) || s1);
  const semanaNum2 = Number(extrairNumeroSemana(s2) || s2);
  const numeroSemana1 = extrairNumeroSemana(String(semanaNum1)) || String(semanaNum1);
  const numeroSemana2 = extrairNumeroSemana(String(semanaNum2)) || String(semanaNum2);

  return {
    praca,
    ano1,
    ano2,
    semanaNum1,
    semanaNum2,
    numeroSemana1,
    numeroSemana2,
  };
}

/**
 * Cria o payload de filtro para RPC
 */
export function createFilterPayload(ano: number, semana: number, praca: string | null) {
  return {
    p_ano: ano,
    p_semana: semana,
    p_praca: praca || null,
    p_sub_praca: null,
    p_origem: null,
    p_turno: null,
  };
}

/**
 * Gera estilos CSS para impressão
 */
export function generatePrintStyles(): string {
  return `
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
}

