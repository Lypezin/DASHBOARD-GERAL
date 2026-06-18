type DemandTotals = {
  total_completadas?: number | null;
  numero_de_pedidos_aceitos_e_concluidos?: number | null;
};

type DemandBreakdown = {
  corridas_completadas?: number | null;
  numero_de_pedidos_aceitos_e_concluidos?: number | null;
};

function toMetricNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getPedidosAceitosConcluidosTotal(data?: DemandTotals | null) {
  if (!data) return 0;

  return toMetricNumber(
    data.numero_de_pedidos_aceitos_e_concluidos ?? data.total_completadas
  );
}

export function getPedidosAceitosConcluidosBreakdown(data?: DemandBreakdown | null) {
  if (!data) return 0;

  return toMetricNumber(
    data.numero_de_pedidos_aceitos_e_concluidos ?? data.corridas_completadas
  );
}
