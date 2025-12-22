import { UtrData, UtrGeral, UtrPorPraca } from '@/types';

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

    for (const row of data) {
        const tempoStr = row.tempo_disponivel_escalado || '0:00:00';
        const [hours, minutes, seconds] = tempoStr.split(':').map(Number);
        totalTempoSegundos += (hours || 0) * 3600 + (minutes || 0) * 60 + (seconds || 0);
        totalCorridas += Number(row.numero_de_corridas_aceitas) || 0;
    }

    const tempoHoras = totalTempoSegundos / 3600;
    const utrGeral: UtrGeral = {
        tempo_horas: tempoHoras,
        corridas: totalCorridas,
        utr: tempoHoras > 0 ? totalCorridas / tempoHoras : 0
    };

    const pracaMap = new Map<string, { tempo: number; corridas: number }>();
    for (const row of data) {
        const praca = row.praca || 'Não especificada';
        const tempoStr = row.tempo_disponivel_escalado || '0:00:00';
        const [hours, minutes, seconds] = tempoStr.split(':').map(Number);
        const tempo = (hours || 0) * 3600 + (minutes || 0) * 60 + (seconds || 0);
        const corridas = Number(row.numero_de_corridas_aceitas) || 0;

        if (pracaMap.has(praca)) {
            const existing = pracaMap.get(praca)!;
            existing.tempo += tempo;
            existing.corridas += corridas;
        } else {
            pracaMap.set(praca, { tempo, corridas });
        }
    }

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
