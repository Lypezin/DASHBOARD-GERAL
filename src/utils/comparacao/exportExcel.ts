import * as XLSX from 'xlsx';
import { DashboardResumoData } from '@/types';
import { getWeeklyHours, getMetricValue, getTimeMetric } from '@/utils/comparacao/metrics';
import { converterHorasParaDecimal, formatarHorasParaHMS } from '@/utils/formatters';
import { findDayData } from '@/utils/comparacao/dataLookup';
import { DIAS_DA_SEMANA } from '@/constants/comparacao';

export function exportComparacaoToExcel(
    dadosComparacao: DashboardResumoData[],
    utrComparacao: any[],
    semanasSelecionadas: string[],
    pracaSelecionada: string | null,
    entregadoresComparativo?: any[]
) {
    if (dadosComparacao.length < 2 || semanasSelecionadas.length < 2) {
        alert('Dados insuficientes para exportar.');
        return;
    }

    const sem1 = semanasSelecionadas[0];
    const sem2 = semanasSelecionadas[1];
    const d1 = dadosComparacao[0];
    const d2 = dadosComparacao[1];

    const getVariation = (val1: number, val2: number) => {
        if (val1 === 0 && val2 === 0) return 0;
        if (val1 === 0) return 100;
        return ((val2 - val1) / val1) * 100;
    };

    // --- TAB 1: RESUMO GERAL ---
    const headersResumo = ["Métrica", `Semana ${sem1}`, `Semana ${sem2}`, "Variação Absoluta", "Variação %"];
    const rowsResumo: any[] = [];

    // Helper to add metric
    const addMetricRow = (label: string, mKey: 'total_ofertadas' | 'total_aceitas' | 'total_completadas' | 'total_rejeitadas') => {
        const val1 = d1[mKey] ?? 0;
        const val2 = d2[mKey] ?? 0;
        const diff = val2 - val1;
        const pct = getVariation(val1, val2);
        rowsResumo.push([
            label,
            val1,
            val2,
            diff,
            `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`
        ]);
    };

    // Aderencia Geral
    const ad1 = d1?.aderencia_semanal?.[0]?.aderencia_percentual ?? 0;
    const ad2 = d2?.aderencia_semanal?.[0]?.aderencia_percentual ?? 0;
    rowsResumo.push([
        "Aderência Geral (%)",
        `${ad1.toFixed(1)}%`,
        `${ad2.toFixed(1)}%`,
        `${(ad2 - ad1) > 0 ? '+' : ''}${(ad2 - ad1).toFixed(1)}%`,
        `${getVariation(ad1, ad2) > 0 ? '+' : ''}${getVariation(ad1, ad2).toFixed(1)}%`
    ]);

    addMetricRow("Corridas Ofertadas", "total_ofertadas");
    addMetricRow("Corridas Aceitas", "total_aceitas");
    addMetricRow("Corridas Completadas", "total_completadas");
    addMetricRow("Corridas Rejeitadas", "total_rejeitadas");

    // Taxa de Aceitação (%)
    const ta1 = d1.total_ofertadas > 0 ? (d1.total_aceitas / d1.total_ofertadas) * 100 : 0;
    const ta2 = d2.total_ofertadas > 0 ? (d2.total_aceitas / d2.total_ofertadas) * 100 : 0;
    const taDiff = ta2 - ta1;
    const taPct = getVariation(ta1, ta2);
    rowsResumo.push([
        "Taxa de Aceitação (%)",
        `${ta1.toFixed(1)}%`,
        `${ta2.toFixed(1)}%`,
        `${taDiff > 0 ? '+' : ''}${taDiff.toFixed(1)}%`,
        `${taPct > 0 ? '+' : ''}${taPct.toFixed(1)}%`
    ]);

    // Taxa de Completude (%)
    const tc1 = d1.total_ofertadas > 0 ? (d1.total_completadas / d1.total_ofertadas) * 100 : 0;
    const tc2 = d2.total_ofertadas > 0 ? (d2.total_completadas / d2.total_ofertadas) * 100 : 0;
    const tcDiff = tc2 - tc1;
    const tcPct = getVariation(tc1, tc2);
    rowsResumo.push([
        "Taxa de Completude (%)",
        `${tc1.toFixed(1)}%`,
        `${tc2.toFixed(1)}%`,
        `${tcDiff > 0 ? '+' : ''}${tcDiff.toFixed(1)}%`,
        `${tcPct > 0 ? '+' : ''}${tcPct.toFixed(1)}%`
    ]);

    // Horas realizadas
    const hr1 = getWeeklyHours(d1, 'horas_entregues');
    const hr2 = getWeeklyHours(d2, 'horas_entregues');
    const hrDec1 = converterHorasParaDecimal(hr1);
    const hrDec2 = converterHorasParaDecimal(hr2);
    const hrDiff = hrDec2 - hrDec1;
    const hrPct = getVariation(hrDec1, hrDec2);
    rowsResumo.push([
        "Horas Realizadas (Decimal)",
        Number(hrDec1.toFixed(2)),
        Number(hrDec2.toFixed(2)),
        Number(hrDiff.toFixed(2)),
        `${hrPct > 0 ? '+' : ''}${hrPct.toFixed(1)}%`
    ]);
    rowsResumo.push([
        "Horas Realizadas (Formatado)",
        hr1,
        hr2,
        formatarHorasParaHMS(hrDiff),
        "-"
    ]);

    const wsResumo = XLSX.utils.aoa_to_sheet([headersResumo, ...rowsResumo]);

    // --- TAB 2: ADERÊNCIA POR DIA ---
    const headersDia = ["Dia da Semana", `Aderência Sem ${sem1} (%)`, `Aderência Sem ${sem2} (%)`, "Variação Aderência %", `Horas Planejadas Sem ${sem1}`, `Horas Planejadas Sem ${sem2}`, `Horas Realizadas Sem ${sem1}`, `Horas Realizadas Sem ${sem2}`];
    const rowsDia = DIAS_DA_SEMANA.map(dia => {
        const diaData1 = findDayData(dia, d1?.aderencia_dia);
        const diaData2 = findDayData(dia, d2?.aderencia_dia);

        const a1 = getMetricValue(diaData1, 'aderencia_percentual');
        const a2 = getMetricValue(diaData2, 'aderencia_percentual');
        const aVar = getVariation(a1, a2);

        const hp1 = getTimeMetric(diaData1, 'horas_planejadas');
        const hp2 = getTimeMetric(diaData2, 'horas_planejadas');

        const hr1Val = getTimeMetric(diaData1, 'horas_entregues');
        const hr2Val = getTimeMetric(diaData2, 'horas_entregues');

        return [
            dia,
            Number(a1.toFixed(1)),
            Number(a2.toFixed(1)),
            `${aVar > 0 ? '+' : ''}${aVar.toFixed(1)}%`,
            hp1,
            hp2,
            hr1Val,
            hr2Val
        ];
    });
    const wsDia = XLSX.utils.aoa_to_sheet([headersDia, ...rowsDia]);

    // --- TAB 3: SUB-PRAÇAS ---
    const subPracasSet = new Set<string>();
    [d1, d2].forEach(dados => {
        const arr = dados?.aderencia_sub_praca || dados?.sub_praca || [];
        arr.forEach((item: any) => {
            if (item?.sub_praca) subPracasSet.add(item.sub_praca);
        });
    });
    const subPracas = Array.from(subPracasSet).sort();

    const headersSub = ["Cidade / Sub-Praça", `Aderência Sem ${sem1} (%)`, `Aderência Sem ${sem2} (%)`, "Variação %", `Ofertadas Sem ${sem1}`, `Ofertadas Sem ${sem2}`, `Aceitas Sem ${sem1}`, `Aceitas Sem ${sem2}`];
    const rowsSub = subPracas.map(sp => {
        const item1 = (d1?.aderencia_sub_praca || d1?.sub_praca || []).find((x: any) => x.sub_praca === sp);
        const item2 = (d2?.aderencia_sub_praca || d2?.sub_praca || []).find((x: any) => x.sub_praca === sp);

        const a1 = getMetricValue(item1, 'aderencia_percentual');
        const a2 = getMetricValue(item2, 'aderencia_percentual');
        const aVar = getVariation(a1, a2);

        const of1 = getMetricValue(item1, 'corridas_ofertadas');
        const of2 = getMetricValue(item2, 'corridas_ofertadas');

        const ac1 = getMetricValue(item1, 'corridas_aceitas');
        const ac2 = getMetricValue(item2, 'corridas_aceitas');

        return [
            sp,
            Number(a1.toFixed(1)),
            Number(a2.toFixed(1)),
            `${aVar > 0 ? '+' : ''}${aVar.toFixed(1)}%`,
            of1,
            of2,
            ac1,
            ac2
        ];
    });
    const wsSub = XLSX.utils.aoa_to_sheet([headersSub, ...rowsSub]);

    // --- TAB 4: TURNOS ---
    const turnosSet = new Set<string>();
    [d1, d2].forEach(dados => {
        const arr = dados?.aderencia_turno || dados?.turno || [];
        arr.forEach((item: any) => {
            if (item?.turno) turnosSet.add(item.turno);
        });
    });
    const turnos = Array.from(turnosSet).sort();

    const headersTurnos = ["Turno", `Aderência Sem ${sem1} (%)`, `Aderência Sem ${sem2} (%)`, "Variação %", `Horas Planejadas Sem ${sem1}`, `Horas Planejadas Sem ${sem2}`, `Horas Realizadas Sem ${sem1}`, `Horas Realizadas Sem ${sem2}`];
    const rowsTurnos = turnos.map(tr => {
        const item1 = (d1?.aderencia_turno || d1?.turno || []).find((x: any) => x.turno === tr);
        const item2 = (d2?.aderencia_turno || d2?.turno || []).find((x: any) => x.turno === tr);

        const a1 = getMetricValue(item1, 'aderencia_percentual');
        const a2 = getMetricValue(item2, 'aderencia_percentual');
        const aVar = getVariation(a1, a2);

        const hp1 = getTimeMetric(item1, 'horas_planejadas');
        const hp2 = getTimeMetric(item2, 'horas_planejadas');

        const hr1Val = getTimeMetric(item1, 'horas_entregues');
        const hr2Val = getTimeMetric(item2, 'horas_entregues');

        return [
            tr,
            Number(a1.toFixed(1)),
            Number(a2.toFixed(1)),
            `${aVar > 0 ? '+' : ''}${aVar.toFixed(1)}%`,
            hp1,
            hp2,
            hr1Val,
            hr2Val
        ];
    });
    const wsTurnos = XLSX.utils.aoa_to_sheet([headersTurnos, ...rowsTurnos]);

    // --- TAB 5: ORIGENS ---
    const origensSet = new Set<string>();
    [d1, d2].forEach(dados => {
        const arr = dados?.aderencia_origem || dados?.origem || [];
        arr.forEach((item: any) => {
            if (item?.origem) origensSet.add(item.origem);
        });
    });
    const origens = Array.from(origensSet).sort();

    const headersOrigens = ["Origem", `Aderência Sem ${sem1} (%)`, `Aderência Sem ${sem2} (%)`, "Variação %", `Ofertadas Sem ${sem1}`, `Ofertadas Sem ${sem2}`, `Aceitas Sem ${sem1}`, `Aceitas Sem ${sem2}`];
    const rowsOrigens = origens.map(or => {
        const item1 = (d1?.aderencia_origem || d1?.origem || []).find((x: any) => x.origem === or);
        const item2 = (d2?.aderencia_origem || d2?.origem || []).find((x: any) => x.origem === or);

        const a1 = getMetricValue(item1, 'aderencia_percentual');
        const a2 = getMetricValue(item2, 'aderencia_percentual');
        const aVar = getVariation(a1, a2);

        const of1 = getMetricValue(item1, 'corridas_ofertadas');
        const of2 = getMetricValue(item2, 'corridas_ofertadas');

        const ac1 = getMetricValue(item1, 'corridas_aceitas');
        const ac2 = getMetricValue(item2, 'corridas_aceitas');

        return [
            or,
            Number(a1.toFixed(1)),
            Number(a2.toFixed(1)),
            `${aVar > 0 ? '+' : ''}${aVar.toFixed(1)}%`,
            of1,
            of2,
            ac1,
            ac2
        ];
    });
    const wsOrigens = XLSX.utils.aoa_to_sheet([headersOrigens, ...rowsOrigens]);

    // --- TAB 6: UTR ---
    const headersUtr = ["Indicador UTR", `Semana ${sem1}`, `Semana ${sem2}`, "Diferença Absoluta", "Variação %"];
    const rowsUtr: any[] = [];

    // Map UTR data items
    const utrSem1 = utrComparacao.find(u => String(u.semana) === String(sem1))?.utr;
    const utrSem2 = utrComparacao.find(u => String(u.semana) === String(sem2))?.utr;

    const addUtrRow = (label: string, propKey: string, formatAsPercent = false) => {
        const val1 = utrSem1 ? Number(utrSem1[propKey] || 0) : 0;
        const val2 = utrSem2 ? Number(utrSem2[propKey] || 0) : 0;
        const diff = val2 - val1;
        const pct = getVariation(val1, val2);
        rowsUtr.push([
            label,
            formatAsPercent ? `${val1.toFixed(1)}%` : val1,
            formatAsPercent ? `${val2.toFixed(1)}%` : val2,
            formatAsPercent ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%` : diff,
            `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`
        ]);
    };

    if (utrSem1 || utrSem2) {
        addUtrRow("Aderência UTR (%)", "aderencia_percentual", true);
        addUtrRow("Corridas Ofertadas", "corridas_ofertadas");
        addUtrRow("Corridas Aceitas", "corridas_aceitas");
        addUtrRow("Corridas Completadas", "corridas_completadas");
        addUtrRow("Corridas Rejeitadas", "corridas_rejeitadas");
        addUtrRow("Taxa de Aceitação (%)", "taxa_aceitacao", true);
        addUtrRow("Taxa de Completude (%)", "taxa_completude", true);
    } else {
        rowsUtr.push(["Nenhum dado UTR disponível para as semanas selecionadas", "", "", "", ""]);
    }
    const wsUtr = XLSX.utils.aoa_to_sheet([headersUtr, ...rowsUtr]);

    // Create workbook and write
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo Geral");
    XLSX.utils.book_append_sheet(wb, wsDia, "Aderência por Dia");
    XLSX.utils.book_append_sheet(wb, wsSub, "Sub-Praças (Cidades)");
    XLSX.utils.book_append_sheet(wb, wsTurnos, "Turnos");
    XLSX.utils.book_append_sheet(wb, wsOrigens, "Origens");
    XLSX.utils.book_append_sheet(wb, wsUtr, "UTR");

    // --- TAB 7: ENTREGADORES ---
    if (entregadoresComparativo && entregadoresComparativo.length > 0) {
        const headersEnt = ["Entregador", "ID", `Horas Sem ${sem1}`, `Horas Sem ${sem2}`];
        
        const formatarSegundosParaHMS = (totalSegundos: number): string => {
            const hrs = Math.floor(totalSegundos / 3600);
            const mins = Math.floor((totalSegundos % 3600) / 60);
            const secs = Math.floor(totalSegundos % 60);
            const pad = (num: number) => String(num).padStart(2, '0');
            return `${hrs}:${pad(mins)}:${pad(secs)}`;
        };

        const rowsEnt = entregadoresComparativo.map(e => [
            e.nome,
            e.id,
            formatarSegundosParaHMS(e.segundosSem1),
            formatarSegundosParaHMS(e.segundosSem2)
        ]);
        
        const totalSem1 = entregadoresComparativo.reduce((sum, e) => sum + e.segundosSem1, 0);
        const totalSem2 = entregadoresComparativo.reduce((sum, e) => sum + e.segundosSem2, 0);
        rowsEnt.push([
            "SOMA TOTAL",
            "-",
            formatarSegundosParaHMS(totalSem1),
            formatarSegundosParaHMS(totalSem2)
        ]);

        const wsEnt = XLSX.utils.aoa_to_sheet([headersEnt, ...rowsEnt]);
        XLSX.utils.book_append_sheet(wb, wsEnt, "Entregadores");
    }

    // Filename
    const pracaLabel = pracaSelecionada ? `_${pracaSelecionada}` : '_TodasPracas';
    const filename = `Comparativo_Semana${sem1}_vs_Semana${sem2}${pracaLabel}.xlsx`;
    XLSX.writeFile(wb, filename);
}
