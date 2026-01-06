import { DashboardResumoData } from '@/types';
import { converterHorasParaDecimal, formatarHorasParaHMS } from '@/utils/formatters';

export function getMetricValue(obj: any, metricKey: string): number {
    if (!obj) return 0;

    const keyMap: Record<string, string[]> = {
        'corridas_ofertadas': ['corridas_ofertadas', 'ofertadas', 'total_ofertadas', 'qtd_ofertadas'],
        'corridas_aceitas': ['corridas_aceitas', 'aceitas', 'total_aceitas', 'qtd_aceitas'],
        'corridas_rejeitadas': ['corridas_rejeitadas', 'rejeitadas', 'total_rejeitadas', 'qtd_rejeitadas'],
        'corridas_completadas': ['corridas_completadas', 'completadas', 'total_completadas', 'qtd_completadas'],
        'aderencia_percentual': ['aderencia_percentual', 'aderencia', 'taxa_aderencia', 'percentual_aderencia'],
        'taxa_aceitacao': ['taxa_aceitacao', 'aceitacao', 'percentual_aceitacao'],
        'taxa_completude': ['taxa_completude', 'completude', 'percentual_completude']
    };

    if (obj[metricKey] != null) return Number(obj[metricKey]);

    const variations = keyMap[metricKey];
    if (variations) {
        for (const key of variations) {
            if (obj[key] != null) return Number(obj[key]);
        }
    }

    return 0;
}

export function getTimeMetric(obj: any, metricKey: string): string | number {
    if (!obj) return '0';

    const keyMap: Record<string, string[]> = {
        'horas_planejadas': ['horas_a_entregar', 'horas_planejadas', 'total_horas_planejadas', 'meta_horas', 'horas_meta'],
        'horas_entregues': ['horas_entregues', 'horas_realizadas', 'total_horas_entregues', 'horas_feitas', 'horas_executadas']
    };

    if (obj[metricKey] != null) return obj[metricKey];

    const variations = keyMap[metricKey];
    if (variations) {
        for (const key of variations) {
            if (obj[key] != null) return obj[key];
        }
    }

    return '0';
}

export function getWeeklyHours(dados: DashboardResumoData, metricKey: 'horas_planejadas' | 'horas_entregues'): string {
    if (!dados) return '00:00:00';

    // 1. Tentar pegar de aderencia_semanal
    if (dados.aderencia_semanal && dados.aderencia_semanal.length > 0) {
        const semanaData = dados.aderencia_semanal[0] as any;

        if (metricKey === 'horas_planejadas' && semanaData.segundos_planejados !== undefined) {
            return formatarHorasParaHMS(Number(semanaData.segundos_planejados) / 3600);
        }
        if (metricKey === 'horas_entregues' && semanaData.segundos_realizados !== undefined) {
            return formatarHorasParaHMS(Number(semanaData.segundos_realizados) / 3600);
        }

        const val = getTimeMetric(semanaData, metricKey);
        if (val && val !== '0' && val !== '00:00:00') return String(val);
    }

    // 2. Fallback: Somar de aderencia_dia
    if (dados.aderencia_dia && dados.aderencia_dia.length > 0) {
        let totalDecimal = 0;

        dados.aderencia_dia.forEach(dia => {
            const d = dia as any;
            if (metricKey === 'horas_planejadas' && d.segundos_planejados !== undefined) {
                totalDecimal += Number(d.segundos_planejados) / 3600;
            } else if (metricKey === 'horas_entregues' && d.segundos_realizados !== undefined) {
                totalDecimal += Number(d.segundos_realizados) / 3600;
            } else {
                const val = getTimeMetric(dia, metricKey);
                totalDecimal += converterHorasParaDecimal(val);
            }
        });

        if (totalDecimal > 0) return formatarHorasParaHMS(totalDecimal);
    }

    return '00:00:00';
}
