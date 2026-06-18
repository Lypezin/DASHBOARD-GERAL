type DemandTotals = {
  total_completadas?: number | null;
  numero_de_pedidos_aceitos_e_concluidos?: number | null;
  pedidos_aceitos_e_concluidos?: number | null;
  total_pedidos_aceitos_e_concluidos?: number | null;
  totais?: DemandBreakdown | null;
};

type DemandBreakdown = {
  corridas_completadas?: number | null;
  numero_de_pedidos_aceitos_e_concluidos?: number | null;
  pedidos_aceitos_e_concluidos?: number | null;
  total_pedidos_aceitos_e_concluidos?: number | null;
};

function toMetricNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pickFirstMetricValue(...values: unknown[]) {
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue;
    return toMetricNumber(value);
  }

  return 0;
}

export function getPedidosAceitosConcluidosTotal(data?: DemandTotals | null) {
  if (!data) return 0;

  return pickFirstMetricValue(
    data.numero_de_pedidos_aceitos_e_concluidos,
    data.pedidos_aceitos_e_concluidos,
    data.total_pedidos_aceitos_e_concluidos,
    data.totais?.numero_de_pedidos_aceitos_e_concluidos,
    data.totais?.pedidos_aceitos_e_concluidos,
    data.totais?.total_pedidos_aceitos_e_concluidos,
    data.total_completadas,
    data.totais?.corridas_completadas
  );
}

export function getPedidosAceitosConcluidosBreakdown(data?: DemandBreakdown | null) {
  if (!data) return 0;

  return pickFirstMetricValue(
    data.numero_de_pedidos_aceitos_e_concluidos,
    data.pedidos_aceitos_e_concluidos,
    data.total_pedidos_aceitos_e_concluidos,
    data.corridas_completadas
  );
}
