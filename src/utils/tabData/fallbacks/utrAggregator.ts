import { UtrData, UtrGeral, UtrPorPraca } from '@/types';

function parseTempoSegundos(tempoStr: unknown): number {
    if (typeof tempoStr !== 'string' || !tempoStr) return 0;
    const [hRaw, mRaw, sRaw] = tempoStr.split(':');
    return (Number(hRaw) || 0) * 3600 + (Number(mRaw) || 0) * 60 + (Number(sRaw) || 0);
}

export const processUtrData = (data: any[]): UtrData => {
    if (!data || data.length === 0) {
        return {
            geral: { tempo_horas: 0, corridas: 0, utr: 0 },
            praca: [],
            sub_praca: [],
            origem: [],
            turno: []
        };
    }

    let totalTempoSegundos = 0;
    let totalCorridas = 0;
    const pracaMap = new Map<string, { tempo: number; corridas: number }>();

    for (const row of data) {
        const tempo = parseTempoSegundos(row.tempo_disponivel_absoluto);
        const corridas = Number(row.numero_de_corridas_aceitas) || 0;
        totalTempoSegundos += tempo;
        totalCorridas += corridas;

        const praca = row.praca || 'Não especificada';
        const existing = pracaMap.get(praca);
        if (existing) {
            existing.tempo += tempo;
            existing.corridas += corridas;
        } else {
            pracaMap.set(praca, { tempo, corridas });
        }
    }

    const tempoHoras = totalTempoSegundos / 3600;
    const utrGeral: UtrGeral = {
        tempo_horas: tempoHoras,
        corridas: totalCorridas,
        utr: tempoHoras > 0 ? totalCorridas / tempoHoras : 0
    };

    const utrPorPraca: UtrPorPraca[] = Array.from(pracaMap.entries()).map(([praca, data]) => ({
        praca,
        tempo_horas: data.tempo / 3600,
        corridas: data.corridas,
        utr: data.tempo > 0 ? data.corridas / (data.tempo / 3600) : 0
    }));

    return {
        geral: utrGeral,
        praca: utrPorPraca,
        sub_praca: [],
        origem: [],
        turno: []
    };
};
