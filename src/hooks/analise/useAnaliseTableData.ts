import { useMemo } from 'react';
import { AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';

type TableType = 'dia' | 'turno' | 'sub_praca' | 'origem';

export function useAnaliseTableData(
    activeTable: TableType,
    aderenciaDia: AderenciaDia[],
    aderenciaTurno: AderenciaTurno[],
    aderenciaSubPraca: AderenciaSubPraca[],
    aderenciaOrigem: AderenciaOrigem[]
) {
    const tableData = useMemo(() => {
        const diasDaSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

        switch (activeTable) {
            case 'dia':
                return aderenciaDia.map(item => {
                    if (item.dia_da_semana) return { ...item, label: item.dia_da_semana };
                    let diaDaSemana = 'N/D';
                    if (item.data) {
                        try {
                            const dataObj = new Date(item.data.includes('T') ? item.data : item.data + 'T00:00:00');
                            if (!isNaN(dataObj.getTime())) diaDaSemana = diasDaSemana[dataObj.getDay()] || 'N/D';
                        } catch (e) { /* ignore */ }
                    }
                    return { ...item, label: diaDaSemana };
                });
            case 'turno': return aderenciaTurno.map(item => ({ ...item, label: item.turno }));
            case 'sub_praca': return aderenciaSubPraca.map(item => ({ ...item, label: item.sub_praca }));
            case 'origem': return aderenciaOrigem.map(item => ({ ...item, label: item.origem }));
            default: return [];
        }
    }, [activeTable, aderenciaDia, aderenciaTurno, aderenciaSubPraca, aderenciaOrigem]);

    const labelColumn = useMemo(() => {
        switch (activeTable) {
            case 'dia': return 'Dia';
            case 'turno': return 'Turno';
            case 'sub_praca': return 'Sub Praça';
            case 'origem': return 'Origem';
            default: return '';
        }
    }, [activeTable]);

    return { tableData, labelColumn };
}
