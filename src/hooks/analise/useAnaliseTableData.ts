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

                    // Fallback para propriedade "dia"
                    if (item.dia) return { ...item, label: item.dia };

                    const rawDate = item.data || (item as any).data_do_periodo;
                    let diaDaSemana = 'N/D';

                    if (rawDate) {
                        try {
                            const dateStr = rawDate.includes('T') ? rawDate : rawDate + 'T00:00:00';
                            const dataObj = new Date(dateStr);

                            if (!isNaN(dataObj.getTime())) {
                                const dayIndex = dataObj.getDay(); // 0 = Domingo
                                diaDaSemana = diasDaSemana[dayIndex] || 'N/D';
                                // Append formatted date for clarity
                                const formattedDate = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                                diaDaSemana = `${diaDaSemana} (${formattedDate})`;
                            } else {
                                diaDaSemana = rawDate; // Fallback to raw string
                            }
                        } catch (e) {
                            diaDaSemana = rawDate;
                        }
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
