import * as XLSXStyle from 'xlsx-js-style';
import type * as XLSXType from 'xlsx';
import { DashboardResumoData } from '@/types';
import { getWeeklyHours, getMetricValue, getTimeMetric } from '@/utils/comparacao/metrics';
import { converterHorasParaDecimal, formatarHorasParaHMS } from '@/utils/formatters';
import { findDayData } from '@/utils/comparacao/dataLookup';
import { DIAS_DA_SEMANA } from '@/constants/comparacao';

type WorksheetTheme = 'blue' | 'green' | 'purple' | 'amber' | 'slate';

const XLSX = XLSXStyle as unknown as typeof import('xlsx');

const THEME_COLORS: Record<WorksheetTheme, string> = {
    blue: '2563EB',
    green: '059669',
    purple: '7C3AED',
    amber: 'D97706',
    slate: '334155',
};

const THEME_LIGHT_COLORS: Record<WorksheetTheme, string> = {
    blue: 'EFF6FF',
    green: 'ECFDF5',
    purple: 'F5F3FF',
    amber: 'FFFBEB',
    slate: 'F8FAFC',
};

const THEME_DARK_COLORS: Record<WorksheetTheme, string> = {
    blue: '1D4ED8',
    green: '047857',
    purple: '6D28D9',
    amber: 'B45309',
    slate: '1E293B',
};

function getExcelNumberFormat(header: string, value: unknown) {
    if (typeof value !== 'number') return undefined;

    const normalizedHeader = header.toLocaleLowerCase('pt-BR');
    if (normalizedHeader.includes('%') || normalizedHeader.includes('taxa') || normalizedHeader.includes('aderencia') || normalizedHeader.includes('aderência')) {
        return '0.0"%"';
    }

    if (!Number.isInteger(value)) {
        return '#,##0.00';
    }

    return '#,##0';
}

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

function sanitizeFileNamePart(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .trim();
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
    ws: XLSXType.WorkSheet,
    headers: string[],
    rows: any[][],
    theme: WorksheetTheme,
    totalRowIndex?: number,
    headerRowIndex = 0
) {
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
    const themeColor = THEME_COLORS[theme];
    const lightThemeColor = THEME_LIGHT_COLORS[theme];
    const darkThemeColor = THEME_DARK_COLORS[theme];
    const tableRange = {
        s: { r: headerRowIndex, c: 0 },
        e: range.e,
    };

    ws['!autofilter'] = { ref: XLSX.utils.encode_range(tableRange) };
    ws['!freeze'] = { xSplit: 0, ySplit: headerRowIndex + 1 };
    ws['!rows'] = Array.from({ length: range.e.r + 1 }, (_, index) => ({
        hpt: index === 0 ? 34 : index === 1 ? 22 : index === headerRowIndex ? 26 : 21,
    }));
    ws['!cols'] = headers.map((header, colIndex) => {
        const maxContentLength = Math.max(
            String(header).length,
            ...rows.map((row) => String(row[colIndex] ?? '').length)
        );

        return { wch: Math.min(Math.max(maxContentLength + 3, colIndex === 0 ? 24 : 14), 46) };
    });

    headers.forEach((_, colIndex) => {
        const cell = ws[XLSX.utils.encode_cell({ r: headerRowIndex, c: colIndex })];
        if (!cell) return;

        cell.s = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: themeColor } },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            border: {
                bottom: { style: 'medium', color: { rgb: themeColor } },
            },
        };
    });

    for (let rowIndex = 0; rowIndex <= range.e.r; rowIndex += 1) {
        for (let colIndex = 0; colIndex <= range.e.c; colIndex += 1) {
            const cell = ws[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex })];
            if (!cell) continue;

            if (rowIndex < headerRowIndex) {
                const isTitle = rowIndex === 0;
                cell.s = {
                    font: {
                        bold: isTitle,
                        sz: isTitle ? 18 : 11,
                        color: { rgb: isTitle ? 'FFFFFF' : '475569' },
                    },
                    fill: isTitle ? { fgColor: { rgb: darkThemeColor } } : rowIndex === 1 ? { fgColor: { rgb: lightThemeColor } } : undefined,
                    alignment: { horizontal: isTitle ? 'center' : 'left', vertical: 'center' },
                    border: rowIndex === 1 ? { bottom: { style: 'thin', color: { rgb: 'CBD5E1' } } } : undefined,
                };
                continue;
            }

            if (rowIndex === headerRowIndex) continue;

            const isTotal = totalRowIndex !== undefined && rowIndex === totalRowIndex;
            const isEven = (rowIndex - headerRowIndex) % 2 === 0;
            const header = headers[colIndex] || '';
            const stringValue = String(cell.v ?? '');
            const normalizedHeader = header.toLocaleLowerCase('pt-BR');
            const isVariationColumn = normalizedHeader.includes('varia') || normalizedHeader.includes('%');
            const isPositiveVariation = isVariationColumn && stringValue.startsWith('+');
            const isNegativeVariation = isVariationColumn && stringValue.startsWith('-');

            cell.s = {
                font: {
                    bold: isTotal || colIndex === 0,
                    color: { rgb: isPositiveVariation ? '047857' : isNegativeVariation ? 'DC2626' : colIndex === 0 ? '0F172A' : '111827' },
                },
                fill: isTotal ? { fgColor: { rgb: 'E0F2FE' } } : isEven ? { fgColor: { rgb: 'F8FAFC' } } : undefined,
                alignment: {
                    horizontal: colIndex === 0 ? 'left' : typeof cell.v === 'number' ? 'right' : 'center',
                    vertical: 'center',
                    wrapText: true,
                },
                border: {
                    bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
                    right: { style: 'thin', color: { rgb: 'CBD5E1' } },
                },
            };
            cell.z = getExcelNumberFormat(header, cell.v);
        }
    }
}

function createStyledSheet(
    headers: string[],
    rows: any[][],
    theme: WorksheetTheme,
    title: string,
    subtitle: string,
    totalRowIndex?: number
) {
    const ws = XLSX.utils.aoa_to_sheet([[title], [subtitle], [], headers, ...rows]);
    const headerRowIndex = 3;
    const totalSheetRowIndex = totalRowIndex !== undefined ? totalRowIndex + headerRowIndex : undefined;

    if (headers.length > 1) {
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
        ];
    }

    styleWorksheet(ws, headers, rows, theme, totalSheetRowIndex, headerRowIndex);
    return ws;
}

function appendSheet(wb: XLSXType.WorkBook, ws: XLSXType.WorkSheet, name: string, color: string) {
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
    const periodoLabel = `Semana ${sem1} vs Semana ${sem2}`;
    const pracaResumo = pracaSelecionada || 'Todas as praças';
    const subtitleBase = `${periodoLabel} - ${pracaResumo}`;

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
        Number(ad1.toFixed(1)),
        Number(ad2.toFixed(1)),
        formatVariation(ad2 - ad1),
        formatVariation(getVariation(ad1, ad2)),
    ]);

    addMetricRow('Corridas Ofertadas', 'total_ofertadas');
    addMetricRow('Corridas Aceitas', 'total_aceitas');
    addMetricRow('Corridas Completadas', 'total_completadas');
    addMetricRow('Corridas Rejeitadas', 'total_rejeitadas');

    const ta1 = d1.total_ofertadas > 0 ? (d1.total_aceitas / d1.total_ofertadas) * 100 : 0;
    const ta2 = d2.total_ofertadas > 0 ? (d2.total_aceitas / d2.total_ofertadas) * 100 : 0;
    rowsResumo.push(['Taxa de Aceitação (%)', Number(ta1.toFixed(1)), Number(ta2.toFixed(1)), formatVariation(ta2 - ta1), formatVariation(getVariation(ta1, ta2))]);

    const tc1 = d1.total_ofertadas > 0 ? (d1.total_completadas / d1.total_ofertadas) * 100 : 0;
    const tc2 = d2.total_ofertadas > 0 ? (d2.total_completadas / d2.total_ofertadas) * 100 : 0;
    rowsResumo.push(['Taxa de Completude (%)', Number(tc1.toFixed(1)), Number(tc2.toFixed(1)), formatVariation(tc2 - tc1), formatVariation(getVariation(tc1, tc2))]);

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
            formatAsPercent ? Number(val1.toFixed(1)) : val1,
            formatAsPercent ? Number(val2.toFixed(1)) : val2,
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
    wb.Props = {
        Title: `Comparativo Semana ${sem1} vs Semana ${sem2}`,
        Subject: 'Exportação da apresentação comparativa',
        Author: 'Dashboard Geral',
        Company: 'Dashboard Geral',
        CreatedDate: new Date(),
    };

    const exportInfoRows = [
        ['Relatório', `Comparativo Semana ${sem1} vs Semana ${sem2}`],
        ['Praça', pracaSelecionada || 'Todas as praças'],
        ['Gerado em', new Date().toLocaleString('pt-BR')],
        ['Abas principais', entregadoresComparativo && entregadoresComparativo.length > 0 ? 7 : 6],
    ];

    appendSheet(
        wb,
        createStyledSheet(['Informação', 'Valor'], exportInfoRows, 'slate', 'Informações da exportação', subtitleBase),
        'Exportação',
        THEME_COLORS.slate
    );

    appendSheet(wb, createStyledSheet(headersResumo, rowsResumo, 'blue', 'Resumo geral', subtitleBase), 'Resumo Geral', THEME_COLORS.blue);
    appendSheet(wb, createStyledSheet(headersDia, rowsDia, 'green', 'Aderência por dia', subtitleBase), 'Aderência por Dia', THEME_COLORS.green);
    appendSheet(wb, createStyledSheet(headersSub, rowsSub, 'purple', 'Sub-praças', subtitleBase), 'Sub-Praças', THEME_COLORS.purple);
    appendSheet(wb, createStyledSheet(headersTurnos, rowsTurnos, 'amber', 'Turnos', subtitleBase), 'Turnos', THEME_COLORS.amber);
    appendSheet(wb, createStyledSheet(headersOrigens, rowsOrigens, 'blue', 'Origens', subtitleBase), 'Origens', THEME_COLORS.blue);
    appendSheet(wb, createStyledSheet(headersUtr, rowsUtr, 'slate', 'UTR', subtitleBase), 'UTR', THEME_COLORS.slate);

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
            createStyledSheet(headersEnt, rowsEnt, 'green', 'Entregadores', subtitleBase, rowsEnt.length),
            'Entregadores',
            THEME_COLORS.green
        );
    }

    const pracaLabel = pracaSelecionada ? `_${sanitizeFileNamePart(pracaSelecionada)}` : '_TodasPracas';
    const filename = `Comparativo_Semana${sem1}_vs_Semana${sem2}${pracaLabel}.xlsx`;
    XLSX.writeFile(wb, filename);
}
