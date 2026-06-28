import * as XLSX from 'xlsx';
import { DashboardResumoData } from '@/types';
import { getWeeklyHours, getMetricValue, getTimeMetric } from '@/utils/comparacao/metrics';
import { converterHorasParaDecimal, formatarHorasParaHMS } from '@/utils/formatters';
import { findDayData } from '@/utils/comparacao/dataLookup';
import { DIAS_DA_SEMANA } from '@/constants/comparacao';

type WorksheetTheme = 'blue' | 'green' | 'purple' | 'amber' | 'slate';

const THEME_COLORS: Record<WorksheetTheme, string> = {
    blue: '2563EB',
    green: '059669',
    purple: '7C3AED',
    amber: 'D97706',
    slate: '334155',
};

function getVariation(val1: number, val2: number) {
    if (val1 === 0 && val2 === 0) return 0;
    if (val1 === 0) return 100;
    return ((val2 - val1) / val1) * 100;
}

function formatVariation(value: number, suffix = '%') {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}${suffix}`;
}

function formatSecondsToHMS(totalSeconds: number): string {
    const absolute = Math.abs(totalSeconds || 0);
    const hours = Math.floor(absolute / 3600);
    const minutes = Math.floor((absolute % 3600) / 60);
    const seconds = Math.floor(absolute % 60);
    const sign = totalSeconds < 0 ? '-' : '';
    return `${sign}${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getFormattedTimeMetric(item: any, metricKey: 'horas_planejadas' | 'horas_entregues') {
    const secondsKey = metricKey === 'horas_planejadas' ? 'segundos_planejados' : 'segundos_realizados';

    if (item?.[secondsKey] !== undefined && item?.[secondsKey] !== null) {
        return formatarHorasParaHMS(Number(item[secondsKey]) / 3600);
    }

    return String(getTimeMetric(item, metricKey) || '00:00:00');
}

function getOfficialWeeklySeconds(dados: DashboardResumoData) {
    const seconds = dados?.aderencia_semanal?.[0]?.segundos_realizados;
    if (seconds !== undefined && seconds !== null) return Number(seconds) || 0;

    return Math.round(converterHorasParaDecimal(getWeeklyHours(dados, 'horas_entregues')) * 3600);
}

function styleWorksheet(
    ws: XLSX.WorkSheet,
    headers: string[],
    rows: any[][],
    theme: WorksheetTheme,
    totalRowIndex?: number
) {
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
    const themeColor = THEME_COLORS[theme];

    ws['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };
    ws['!rows'] = [{ hpt: 24 }];
    ws['!cols'] = headers.map((header, colIndex) => {
        const maxContentLength = Math.max(
            String(header).length,
            ...rows.map((row) => String(row[colIndex] ?? '').length)
        );

        return { wch: Math.min(Math.max(maxContentLength + 3, colIndex === 0 ? 24 : 14), 44) };
    });

    headers.forEach((_, colIndex) => {
        const cell = ws[XLSX.utils.encode_cell({ r: 0, c: colIndex })];
        if (!cell) return;

        cell.s = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: themeColor } },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        };
    });

    for (let rowIndex = 1; rowIndex <= range.e.r; rowIndex += 1) {
        for (let colIndex = 0; colIndex <= range.e.c; colIndex += 1) {
            const cell = ws[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex })];
            if (!cell) continue;

            const isTotal = totalRowIndex !== undefined && rowIndex === totalRowIndex;
            cell.s = {
                font: { bold: isTotal },
                fill: isTotal ? { fgColor: { rgb: 'E0F2FE' } } : undefined,
                alignment: {
                    horizontal: colIndex === 0 ? 'left' : 'center',
                    vertical: 'center',
                    wrapText: true,
                },
                border: {
                    bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
                },
            };
        }
    }
}

function createStyledSheet(headers: string[], rows: any[][], theme: WorksheetTheme, totalRowIndex?: number) {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    styleWorksheet(ws, headers, rows, theme, totalRowIndex);
    return ws;
}

function appendSheet(wb: XLSX.WorkBook, ws: XLSX.WorkSheet, name: string, color: string) {
    XLSX.utils.book_append_sheet(wb, ws, name);
    const sheet = wb.Workbook?.Sheets?.find((item) => item.name === name);
    if (sheet) {
        (sheet as typeof sheet & { TabColor?: { rgb: string } }).TabColor = { rgb: color };
    }
}

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

    const headersResumo = ['Métrica', `Semana ${sem1}`, `Semana ${sem2}`, 'Variação Absoluta', 'Variação %'];
    const rowsResumo: any[][] = [];

    const addMetricRow = (label: string, mKey: 'total_ofertadas' | 'total_aceitas' | 'total_completadas' | 'total_rejeitadas') => {
        const val1 = d1[mKey] ?? 0;
        const val2 = d2[mKey] ?? 0;
        rowsResumo.push([label, val1, val2, val2 - val1, formatVariation(getVariation(val1, val2))]);
    };

    const ad1 = d1?.aderencia_semanal?.[0]?.aderencia_percentual ?? 0;
    const ad2 = d2?.aderencia_semanal?.[0]?.aderencia_percentual ?? 0;
    rowsResumo.push([
        'Aderência Geral (%)',
        `${ad1.toFixed(1)}%`,
        `${ad2.toFixed(1)}%`,
        formatVariation(ad2 - ad1),
        formatVariation(getVariation(ad1, ad2)),
    ]);

    addMetricRow('Corridas Ofertadas', 'total_ofertadas');
    addMetricRow('Corridas Aceitas', 'total_aceitas');
    addMetricRow('Corridas Completadas', 'total_completadas');
    addMetricRow('Corridas Rejeitadas', 'total_rejeitadas');

    const ta1 = d1.total_ofertadas > 0 ? (d1.total_aceitas / d1.total_ofertadas) * 100 : 0;
    const ta2 = d2.total_ofertadas > 0 ? (d2.total_aceitas / d2.total_ofertadas) * 100 : 0;
    rowsResumo.push(['Taxa de Aceitação (%)', `${ta1.toFixed(1)}%`, `${ta2.toFixed(1)}%`, formatVariation(ta2 - ta1), formatVariation(getVariation(ta1, ta2))]);

    const tc1 = d1.total_ofertadas > 0 ? (d1.total_completadas / d1.total_ofertadas) * 100 : 0;
    const tc2 = d2.total_ofertadas > 0 ? (d2.total_completadas / d2.total_ofertadas) * 100 : 0;
    rowsResumo.push(['Taxa de Completude (%)', `${tc1.toFixed(1)}%`, `${tc2.toFixed(1)}%`, formatVariation(tc2 - tc1), formatVariation(getVariation(tc1, tc2))]);

    const hr1 = getWeeklyHours(d1, 'horas_entregues');
    const hr2 = getWeeklyHours(d2, 'horas_entregues');
    const hrDec1 = converterHorasParaDecimal(hr1);
    const hrDec2 = converterHorasParaDecimal(hr2);
    const hrDiff = hrDec2 - hrDec1;
    rowsResumo.push(['Horas Realizadas (Decimal)', Number(hrDec1.toFixed(2)), Number(hrDec2.toFixed(2)), Number(hrDiff.toFixed(2)), formatVariation(getVariation(hrDec1, hrDec2))]);
    rowsResumo.push(['Horas Realizadas (Formatado)', hr1, hr2, formatarHorasParaHMS(hrDiff), '-']);

    const headersDia = ['Dia da Semana', `Aderência Sem ${sem1} (%)`, `Aderência Sem ${sem2} (%)`, 'Variação Aderência %', `Horas Planejadas Sem ${sem1}`, `Horas Planejadas Sem ${sem2}`, `Horas Realizadas Sem ${sem1}`, `Horas Realizadas Sem ${sem2}`];
    const rowsDia = DIAS_DA_SEMANA.map((dia) => {
        const diaData1 = findDayData(dia, d1?.aderencia_dia);
        const diaData2 = findDayData(dia, d2?.aderencia_dia);
        const a1 = getMetricValue(diaData1, 'aderencia_percentual');
        const a2 = getMetricValue(diaData2, 'aderencia_percentual');

        return [
            dia,
            Number(a1.toFixed(1)),
            Number(a2.toFixed(1)),
            formatVariation(getVariation(a1, a2)),
            getFormattedTimeMetric(diaData1, 'horas_planejadas'),
            getFormattedTimeMetric(diaData2, 'horas_planejadas'),
            getFormattedTimeMetric(diaData1, 'horas_entregues'),
            getFormattedTimeMetric(diaData2, 'horas_entregues'),
        ];
    });

    const subPracasSet = new Set<string>();
    [d1, d2].forEach((dados) => {
        const arr = dados?.aderencia_sub_praca || dados?.sub_praca || [];
        arr.forEach((item: any) => {
            if (item?.sub_praca) subPracasSet.add(item.sub_praca);
        });
    });

    const headersSub = ['Cidade / Sub-Praça', `Aderência Sem ${sem1} (%)`, `Aderência Sem ${sem2} (%)`, 'Variação %', `Horas Planejadas Sem ${sem1}`, `Horas Planejadas Sem ${sem2}`, `Horas Realizadas Sem ${sem1}`, `Horas Realizadas Sem ${sem2}`, `Ofertadas Sem ${sem1}`, `Ofertadas Sem ${sem2}`, `Aceitas Sem ${sem1}`, `Aceitas Sem ${sem2}`];
    const rowsSub = Array.from(subPracasSet).sort().map((sp) => {
        const item1 = (d1?.aderencia_sub_praca || d1?.sub_praca || []).find((x: any) => x.sub_praca === sp);
        const item2 = (d2?.aderencia_sub_praca || d2?.sub_praca || []).find((x: any) => x.sub_praca === sp);
        const a1 = getMetricValue(item1, 'aderencia_percentual');
        const a2 = getMetricValue(item2, 'aderencia_percentual');

        return [
            sp,
            Number(a1.toFixed(1)),
            Number(a2.toFixed(1)),
            formatVariation(getVariation(a1, a2)),
            getFormattedTimeMetric(item1, 'horas_planejadas'),
            getFormattedTimeMetric(item2, 'horas_planejadas'),
            getFormattedTimeMetric(item1, 'horas_entregues'),
            getFormattedTimeMetric(item2, 'horas_entregues'),
            getMetricValue(item1, 'corridas_ofertadas'),
            getMetricValue(item2, 'corridas_ofertadas'),
            getMetricValue(item1, 'corridas_aceitas'),
            getMetricValue(item2, 'corridas_aceitas'),
        ];
    });

    const turnosSet = new Set<string>();
    [d1, d2].forEach((dados) => {
        const arr = dados?.aderencia_turno || dados?.turno || [];
        arr.forEach((item: any) => {
            if (item?.turno) turnosSet.add(item.turno);
        });
    });

    const headersTurnos = ['Turno', `Aderência Sem ${sem1} (%)`, `Aderência Sem ${sem2} (%)`, 'Variação %', `Horas Planejadas Sem ${sem1}`, `Horas Planejadas Sem ${sem2}`, `Horas Realizadas Sem ${sem1}`, `Horas Realizadas Sem ${sem2}`];
    const rowsTurnos = Array.from(turnosSet).sort().map((turno) => {
        const item1 = (d1?.aderencia_turno || d1?.turno || []).find((x: any) => x.turno === turno);
        const item2 = (d2?.aderencia_turno || d2?.turno || []).find((x: any) => x.turno === turno);
        const a1 = getMetricValue(item1, 'aderencia_percentual');
        const a2 = getMetricValue(item2, 'aderencia_percentual');

        return [
            turno,
            Number(a1.toFixed(1)),
            Number(a2.toFixed(1)),
            formatVariation(getVariation(a1, a2)),
            getFormattedTimeMetric(item1, 'horas_planejadas'),
            getFormattedTimeMetric(item2, 'horas_planejadas'),
            getFormattedTimeMetric(item1, 'horas_entregues'),
            getFormattedTimeMetric(item2, 'horas_entregues'),
        ];
    });

    const origensSet = new Set<string>();
    [d1, d2].forEach((dados) => {
        const arr = dados?.aderencia_origem || dados?.origem || [];
        arr.forEach((item: any) => {
            if (item?.origem) origensSet.add(item.origem);
        });
    });

    const headersOrigens = ['Origem', `Aderência Sem ${sem1} (%)`, `Aderência Sem ${sem2} (%)`, 'Variação %', `Horas Planejadas Sem ${sem1}`, `Horas Planejadas Sem ${sem2}`, `Horas Realizadas Sem ${sem1}`, `Horas Realizadas Sem ${sem2}`, `Ofertadas Sem ${sem1}`, `Ofertadas Sem ${sem2}`, `Aceitas Sem ${sem1}`, `Aceitas Sem ${sem2}`];
    const rowsOrigens = Array.from(origensSet).sort().map((origem) => {
        const item1 = (d1?.aderencia_origem || d1?.origem || []).find((x: any) => x.origem === origem);
        const item2 = (d2?.aderencia_origem || d2?.origem || []).find((x: any) => x.origem === origem);
        const a1 = getMetricValue(item1, 'aderencia_percentual');
        const a2 = getMetricValue(item2, 'aderencia_percentual');

        return [
            origem,
            Number(a1.toFixed(1)),
            Number(a2.toFixed(1)),
            formatVariation(getVariation(a1, a2)),
            getFormattedTimeMetric(item1, 'horas_planejadas'),
            getFormattedTimeMetric(item2, 'horas_planejadas'),
            getFormattedTimeMetric(item1, 'horas_entregues'),
            getFormattedTimeMetric(item2, 'horas_entregues'),
            getMetricValue(item1, 'corridas_ofertadas'),
            getMetricValue(item2, 'corridas_ofertadas'),
            getMetricValue(item1, 'corridas_aceitas'),
            getMetricValue(item2, 'corridas_aceitas'),
        ];
    });

    const headersUtr = ['Indicador UTR', `Semana ${sem1}`, `Semana ${sem2}`, 'Diferença Absoluta', 'Variação %'];
    const rowsUtr: any[][] = [];
    const utrSem1 = utrComparacao.find((u) => String(u.semana) === String(sem1))?.utr;
    const utrSem2 = utrComparacao.find((u) => String(u.semana) === String(sem2))?.utr;

    const addUtrRow = (label: string, propKey: string, formatAsPercent = false) => {
        const val1 = utrSem1 ? Number(utrSem1[propKey] || 0) : 0;
        const val2 = utrSem2 ? Number(utrSem2[propKey] || 0) : 0;
        const diff = val2 - val1;
        rowsUtr.push([
            label,
            formatAsPercent ? `${val1.toFixed(1)}%` : val1,
            formatAsPercent ? `${val2.toFixed(1)}%` : val2,
            formatAsPercent ? formatVariation(diff) : diff,
            formatVariation(getVariation(val1, val2)),
        ]);
    };

    if (utrSem1 || utrSem2) {
        addUtrRow('Aderência UTR (%)', 'aderencia_percentual', true);
        addUtrRow('Corridas Ofertadas', 'corridas_ofertadas');
        addUtrRow('Corridas Aceitas', 'corridas_aceitas');
        addUtrRow('Corridas Completadas', 'corridas_completadas');
        addUtrRow('Corridas Rejeitadas', 'corridas_rejeitadas');
        addUtrRow('Taxa de Aceitação (%)', 'taxa_aceitacao', true);
        addUtrRow('Taxa de Completude (%)', 'taxa_completude', true);
    } else {
        rowsUtr.push(['Nenhum dado UTR disponível para as semanas selecionadas', '', '', '', '']);
    }

    const wb = XLSX.utils.book_new();
    appendSheet(wb, createStyledSheet(headersResumo, rowsResumo, 'blue'), 'Resumo Geral', THEME_COLORS.blue);
    appendSheet(wb, createStyledSheet(headersDia, rowsDia, 'green'), 'Aderência por Dia', THEME_COLORS.green);
    appendSheet(wb, createStyledSheet(headersSub, rowsSub, 'purple'), 'Sub-Praças', THEME_COLORS.purple);
    appendSheet(wb, createStyledSheet(headersTurnos, rowsTurnos, 'amber'), 'Turnos', THEME_COLORS.amber);
    appendSheet(wb, createStyledSheet(headersOrigens, rowsOrigens, 'blue'), 'Origens', THEME_COLORS.blue);
    appendSheet(wb, createStyledSheet(headersUtr, rowsUtr, 'slate'), 'UTR', THEME_COLORS.slate);

    if (entregadoresComparativo && entregadoresComparativo.length > 0) {
        const headersEnt = ['Entregador', 'ID', `Horas Sem ${sem1}`, `Horas Sem ${sem2}`, 'Diferença'];
        const rowsEnt = entregadoresComparativo.map((entregador) => [
            entregador.nome,
            entregador.id,
            formatSecondsToHMS(entregador.segundosSem1),
            formatSecondsToHMS(entregador.segundosSem2),
            formatSecondsToHMS((entregador.segundosSem2 || 0) - (entregador.segundosSem1 || 0)),
        ]);

        const totalSem1 = getOfficialWeeklySeconds(d1);
        const totalSem2 = getOfficialWeeklySeconds(d2);
        rowsEnt.push([
            'SOMA TOTAL OFICIAL',
            '-',
            formatSecondsToHMS(totalSem1),
            formatSecondsToHMS(totalSem2),
            formatSecondsToHMS(totalSem2 - totalSem1),
        ]);

        appendSheet(
            wb,
            createStyledSheet(headersEnt, rowsEnt, 'green', rowsEnt.length),
            'Entregadores',
            THEME_COLORS.green
        );
    }

    const pracaLabel = pracaSelecionada ? `_${pracaSelecionada}` : '_TodasPracas';
    const filename = `Comparativo_Semana${sem1}_vs_Semana${sem2}${pracaLabel}.xlsx`;
    XLSX.writeFile(wb, filename);
}
