import type { ValoresEntregador } from '@/types';

const valoresNameCollator = new Intl.Collator('pt-BR', {
    sensitivity: 'base',
    numeric: true,
});

function toFiniteNumber(value: unknown) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function hasMojibake(value: string) {
    return value.includes('\u00c3') || value.includes('\u00c2') || value.includes('\ufffd');
}

function chooseDisplayName(current: string, candidate: string, fallback: string) {
    const normalizedCurrent = current.trim();
    const normalizedCandidate = candidate.trim();

    if (!normalizedCandidate) return normalizedCurrent || fallback;
    if (!normalizedCurrent || normalizedCurrent === fallback) return normalizedCandidate;
    if (hasMojibake(normalizedCurrent) && !hasMojibake(normalizedCandidate)) return normalizedCandidate;
    return normalizedCurrent;
}

/**
 * Garante uma linha por entregador e recalcula a media ponderada.
 *
 * Alguns dados historicos possuem variacoes de nome para o mesmo ID. O RPC
 * antigo agrupava por ID + nome, duplicando a pessoa e dividindo seus valores
 * em varias linhas. Esta normalizacao mantem a tela correta mesmo enquanto
 * respostas antigas ainda estiverem em cache.
 */
export function normalizeValoresEntregadores(
    values: ValoresEntregador[] | null | undefined
): ValoresEntregador[] {
    if (!Array.isArray(values) || values.length === 0) return [];

    const byDriverId = new Map<string, ValoresEntregador>();

    for (const item of values) {
        if (!item) continue;

        const driverId = String(item.id_entregador || '').trim();
        if (!driverId) continue;

        const totalTaxas = toFiniteNumber(item.total_taxas);
        const corridas = toFiniteNumber(item.numero_corridas_aceitas);
        const candidateName = String(item.nome_entregador || '').trim();
        const existing = byDriverId.get(driverId);

        if (existing) {
            existing.nome_entregador = chooseDisplayName(
                existing.nome_entregador,
                candidateName,
                driverId
            );
            existing.total_taxas += totalTaxas;
            existing.numero_corridas_aceitas += corridas;
            existing.taxa_media = existing.numero_corridas_aceitas > 0
                ? existing.total_taxas / existing.numero_corridas_aceitas
                : 0;
            continue;
        }

        byDriverId.set(driverId, {
            id_entregador: driverId,
            nome_entregador: candidateName || driverId,
            total_taxas: totalTaxas,
            numero_corridas_aceitas: corridas,
            taxa_media: corridas > 0 ? totalTaxas / corridas : 0,
        });
    }

    return Array.from(byDriverId.values()).sort((a, b) => {
        const totalDifference = b.total_taxas - a.total_taxas;
        if (totalDifference !== 0) return totalDifference;
        return valoresNameCollator.compare(a.nome_entregador, b.nome_entregador);
    });
}
