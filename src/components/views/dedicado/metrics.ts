export function normalizeMetricNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculateHourlyAderencia(realizados: unknown, planejados: unknown) {
  const totalPlanejados = normalizeMetricNumber(planejados);
  if (totalPlanejados <= 0) return 0;
  return (normalizeMetricNumber(realizados) / totalPlanejados) * 100;
}

export function calculateAcceptanceRate(aceitas: unknown, ofertadas: unknown) {
  const totalOfertadas = normalizeMetricNumber(ofertadas);
  if (totalOfertadas <= 0) return 0;
  return (normalizeMetricNumber(aceitas) / totalOfertadas) * 100;
}

export function calculateCompletionRate(completadas: unknown, aceitas: unknown) {
  const totalAceitas = normalizeMetricNumber(aceitas);
  if (totalAceitas <= 0) return 0;
  return (normalizeMetricNumber(completadas) / totalAceitas) * 100;
}

export function calculateNormalAderencia(completadas: unknown, ofertadas: unknown) {
  const totalOfertadas = normalizeMetricNumber(ofertadas);
  if (totalOfertadas <= 0) return 0;
  return (normalizeMetricNumber(completadas) / totalOfertadas) * 100;
}

export function formatMetricPercent(value: unknown) {
  return `${normalizeMetricNumber(value).toFixed(1)}%`;
}

export function formatMetricPercentOrDash(value: unknown, hasBase: boolean) {
  return hasBase ? formatMetricPercent(value) : '-';
}

export function formatMetricPercentOrNA(value: unknown, hasBase: boolean) {
  return hasBase ? formatMetricPercent(value) : 'N/D';
}
