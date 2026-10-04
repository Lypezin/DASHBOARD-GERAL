export interface DimensionFilterSupport {
  subPraca: boolean;
  origem: boolean;
  turno: boolean;
}

const ALL_DIMENSIONS: DimensionFilterSupport = {
  subPraca: true,
  origem: true,
  turno: true,
};

const SUB_PRACA_AND_ORIGEM: DimensionFilterSupport = {
  subPraca: true,
  origem: true,
  turno: false,
};

const NO_DIMENSIONS: DimensionFilterSupport = {
  subPraca: false,
  origem: false,
  turno: false,
};

const SUPPORT_BY_TAB: Record<string, DimensionFilterSupport> = {
  dashboard: ALL_DIMENSIONS,
  analise: ALL_DIMENSIONS,
  utr: ALL_DIMENSIONS,
  comparacao: ALL_DIMENSIONS,
  evolucao: ALL_DIMENSIONS,
  entregadores: SUB_PRACA_AND_ORIGEM,
  prioridade: SUB_PRACA_AND_ORIGEM,
  valores: SUB_PRACA_AND_ORIGEM,
  marketing: NO_DIMENSIONS,
  marketing_comparacao: NO_DIMENSIONS,
};

export function getDimensionFilterSupport(activeTab: string): DimensionFilterSupport {
  return SUPPORT_BY_TAB[activeTab] || ALL_DIMENSIONS;
}
