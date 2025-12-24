
import { useMemo } from 'react';
import { AderenciaDia } from '@/types';

export function useDailyPerformanceData(aderenciaDia: AderenciaDia[]) {
    // Processar aderência por dia - converter data em dia da semana
    return useMemo(() => {
        const diasDaSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const mapaDias: Record<string, number> = {
            'Domingo': 7, 'Segunda': 1, 'Terça': 2, 'Terca': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6, 'Sabado': 6
        };

        return [...aderenciaDia]
            .map(dia => {
                // Se já tem dia_da_semana e dia_iso, usa eles
                if (dia.dia_da_semana && dia.dia_iso) return dia;

                // Se tem dia_da_semana mas não dia_iso, tenta mapear
                if (dia.dia_da_semana && !dia.dia_iso) {
                    return {
                        ...dia,
                        dia_iso: mapaDias[dia.dia_da_semana] || 0
                    };
                }

                // Se tem data, calcula
                if (dia.data) {
                    const dataObj = new Date(dia.data + 'T00:00:00');
                    if (!isNaN(dataObj.getTime())) {
                        const diaDaSemana = diasDaSemana[dataObj.getDay()];
                        const diaIso = dataObj.getDay() === 0 ? 7 : dataObj.getDay(); // ISO: 1=Segunda, 7=Domingo

                        return {
                            ...dia,
                            dia_da_semana: diaDaSemana,
                            dia_iso: diaIso
                        };
                    }
                }

                return dia;
            })
            .filter(dia => dia.dia_da_semana) // Garante que temos pelo menos o nome do dia
            .sort((a, b) => (a.dia_iso || 0) - (b.dia_iso || 0));
    }, [aderenciaDia]);
}
