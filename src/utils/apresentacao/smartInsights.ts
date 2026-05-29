import { DadosProcessados } from './dataProcessor';

export interface Insight {
    type: 'positive' | 'negative' | 'neutral' | 'highlight';
    text: string;
    value?: string;
}

export const generateSmartInsights = (dados: DadosProcessados): Insight[] => {
    const insights: Insight[] = [];
    const { resumoSemana1, resumoSemana2, subPracasComparativo, turnosComparativo } = dados;

    // 1. General Trend
    const diff = resumoSemana2.aderencia - resumoSemana1.aderencia;
    if (diff > 1) {
        insights.push({
            type: 'positive',
            text: `A aderência geral aumentou ${diff.toFixed(1)}% em relação à semana anterior.`,
            value: `+${diff.toFixed(1)}%`
        });
    } else if (diff < -1) {
        insights.push({
            type: 'negative',
            text: `Houve uma queda de ${Math.abs(diff).toFixed(1)}% na aderência geral.`,
            value: `${diff.toFixed(1)}%`
        });
    } else {
        insights.push({
            type: 'neutral',
            text: `A aderência manteve-se estável com variação de ${diff.toFixed(1)}%.`
        });
    }

    // 2. Best Sub-Praça
    const sortedSub = [...subPracasComparativo].sort((a, b) => b.semana2.aderencia - a.semana2.aderencia);
    const best = sortedSub[0];
    if (best && best.semana2.aderencia > 95) {
        insights.push({
            type: 'highlight',
            text: `${best.nome} é o destaque da semana com ${best.semana2.aderencia.toFixed(1)}% de aderência!`,
            value: '🏆'
        });
    }

    // 3. Biggest Opportunity (Lowest Sub-Praça)
    const worst = sortedSub[sortedSub.length - 1];
    if (worst && worst.semana2.aderencia < 80) {
        insights.push({
            type: 'negative',
            text: `${worst.nome} requer atenção, apresentando a menor aderência (${worst.semana2.aderencia.toFixed(1)}%).`
        });
    }

    // 4. Turno Highlight
    const sortedTurnos = [...turnosComparativo].sort((a, b) => b.semana2.aderencia - a.semana2.aderencia);
    const bestTurno = sortedTurnos[0];
    if (bestTurno) {
        insights.push({
            type: 'neutral',
            text: `O turno ${bestTurno.nome} lidera a eficiência operacional com ${bestTurno.semana2.aderencia.toFixed(1)}%.`
        });
    }

    return insights;
};
