import type * as XLSXType from 'xlsx-js-style';

type SheetTheme = 'blue' | 'green' | 'purple' | 'amber' | 'slate' | 'emerald';

export const EXCEL_THEME_COLORS: Record<SheetTheme, string> = {
  blue: '2563EB',
  green: '059669',
  purple: '7C3AED',
  amber: 'D97706',
  slate: '334155',
  emerald: '047857',
};

type SheetRow = Record<string, unknown>;

interface StyledSheetOptions {
  title: string;
  subtitle?: string;
  theme?: SheetTheme;
  emptyMessage?: string;
  highlightFirstColumn?: boolean;
}

const INVALID_SHEET_NAME_CHARS = /[:\\/?*[\]]/g;
const MAX_SHEET_NAME_LENGTH = 31;
export const EXCEL_MAX_DATA_ROWS = 1_048_572;
const BORDER_COLOR = 'E2E8F0';
const GRID_COLOR = 'CBD5E1';
const DATA_ROW_HEIGHT = { hpt: 23 };
const DATA_CELL_STYLES = new Map<string, Record<string, unknown>>();

export function calculateColumnWidths(
  headers: readonly string[],
  rows: readonly (readonly unknown[])[],
  options: { maxWidth?: number; padding?: number } = {}
) {
  const maxWidth = options.maxWidth ?? 58;
  const padding = options.padding ?? 4;
  const maxContentWidth = Math.max(0, maxWidth - padding);
  const maxLengths = headers.map((header) => Math.min(header.length, maxContentWidth));

  // Avoid spreading every row into Math.max: large exports can exceed the
  // JavaScript argument limit and allocate a second array as large as the file.
  for (const row of rows) {
    for (let columnIndex = 0; columnIndex < headers.length; columnIndex += 1) {
      if (maxLengths[columnIndex] >= maxContentWidth) continue;
      const valueLength = String(row[columnIndex] ?? '').length;
      if (valueLength > maxLengths[columnIndex]) {
        maxLengths[columnIndex] = Math.min(valueLength, maxContentWidth);
      }
    }
  }

  return createColumnWidths(headers, maxLengths, maxWidth, padding);
}

function createColumnWidths(
  headers: readonly string[],
  maxLengths: readonly number[],
  maxWidth: number,
  padding: number
) {
  return headers.map((_, columnIndex) => ({
    wch: Math.min(
      Math.max(maxLengths[columnIndex] + padding, columnIndex === 0 ? 24 : 14),
      maxWidth
    ),
  }));
}

function calculateRecordColumnWidths(
  headers: readonly string[],
  rows: readonly SheetRow[],
  options: { maxWidth?: number; padding?: number } = {}
) {
  const maxWidth = options.maxWidth ?? 58;
  const padding = options.padding ?? 4;
  const maxContentWidth = Math.max(0, maxWidth - padding);
  const maxLengths = headers.map((header) => Math.min(header.length, maxContentWidth));

  // Scan records directly so large exports do not allocate another full row
  // matrix solely for column sizing and worksheet construction.
  for (const row of rows) {
    for (let columnIndex = 0; columnIndex < headers.length; columnIndex += 1) {
      if (maxLengths[columnIndex] >= maxContentWidth) continue;
      const valueLength = String(row[headers[columnIndex]] ?? '').length;
      if (valueLength > maxLengths[columnIndex]) {
        maxLengths[columnIndex] = Math.min(valueLength, maxContentWidth);
      }
    }
  }

  return createColumnWidths(headers, maxLengths, maxWidth, padding);
}

function sanitizeSheetName(name: string) {
  const sanitized = name.replace(INVALID_SHEET_NAME_CHARS, ' ').replace(/\s+/g, ' ').trim();
  return (sanitized || 'Planilha').slice(0, MAX_SHEET_NAME_LENGTH);
}

function normalizeRows(rows: SheetRow[], emptyMessage?: string) {
  return rows.length > 0 ? rows : [{ Aviso: emptyMessage || 'Sem dados para os filtros atuais' }];
}

export function assertExcelRowLimit(rowCount: number) {
  if (rowCount > EXCEL_MAX_DATA_ROWS) {
    throw new Error(`A exportação excede o limite do Excel de ${EXCEL_MAX_DATA_ROWS.toLocaleString('pt-BR')} linhas por planilha.`);
  }
}

export function createExcelFilterRows(filters?: Record<string, unknown>) {
  if (!filters) return [{ Filtro: 'Escopo', Valor: 'Filtros não informados' }];

  const labels: Record<string, string> = {
    p_organization_id: 'Organização (ID)',
    p_ano: 'Ano',
    p_semana: 'Semana',
    p_semanas: 'Semanas selecionadas',
    p_praca: 'Praça',
    p_sub_praca: 'Sub-praça',
    p_origem: 'Origem',
    p_turno: 'Turno',
    p_sub_pracas: 'Sub-praças selecionadas',
    p_origens: 'Origens selecionadas',
    p_turnos: 'Turnos selecionados',
    p_data_inicial: 'Data inicial',
    p_data_final: 'Data final',
    p_search: 'Pesquisa',
    p_only_inactive: 'Somente entregadores inativos',
    p_detailed: 'Detalhamento',
    detailed: 'Detalhamento',
  };

  const rows = Object.entries(filters)
    .filter(([key]) => (key.startsWith('p_') || key === 'detailed') && !/(token|password|secret|authorization)/i.test(key))
    .map(([key, value]) => {
      const normalizedValue = Array.isArray(value)
        ? value.length > 0 ? value.join(', ') : null
        : value && typeof value === 'object' ? JSON.stringify(value) : value;
      const displayValue = normalizedValue === null || normalizedValue === undefined || normalizedValue === ''
        ? 'Todas'
        : key === 'p_semana' && normalizedValue === 0 ? 'Todas' : String(normalizedValue);
      return { Filtro: labels[key] || key.replace(/^p_/, '').replace(/_/g, ' '), Valor: displayValue };
    });

  return rows.length > 0 ? rows : [{ Filtro: 'Escopo', Valor: 'Todos os filtros' }];
}

function getHeaders(rows: SheetRow[]) {
  const headers = new Set<string>();
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => headers.add(key));
  });
  return Array.from(headers);
}

function cellAddress(XLSX: typeof XLSXType, row: number, col: number) {
  return XLSX.utils.encode_cell({ r: row, c: col });
}

function getCellFormat(header: string, value: unknown) {
  if (typeof value !== 'number') return undefined;

  const normalizedHeader = header
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (
    normalizedHeader.includes('r$') ||
    normalizedHeader.includes('custo') ||
    normalizedHeader.includes('valor total') ||
    normalizedHeader.includes('gasto') ||
    normalizedHeader.includes('taxa media')
  ) {
    return '"R$" #,##0.00';
  }

  if (
    normalizedHeader.includes('%') ||
    normalizedHeader.includes('taxa') ||
    normalizedHeader.includes('aderencia') ||
    normalizedHeader.includes('aceitacao') ||
    normalizedHeader.includes('completude') ||
    normalizedHeader.includes('rejeicao') ||
    normalizedHeader.includes('percentual')
  ) {
    return '0.0"%"';
  }

  if (!Number.isInteger(value)) {
    return '#,##0.00';
  }

  return '#,##0';
}

function getDataCellStyle(isEven: boolean, highlight: boolean, alignment: 'left' | 'center' | 'right') {
  const key = `${isEven ? 'even' : 'odd'}:${highlight ? 'highlight' : 'normal'}:${alignment}`;
  const cached = DATA_CELL_STYLES.get(key);
  if (cached) return cached;

  const style = {
    font: highlight ? { bold: true, color: { rgb: '0F172A' } } : undefined,
    fill: highlight ? { fgColor: { rgb: 'EEF2FF' } } : isEven ? { fgColor: { rgb: 'F8FAFC' } } : undefined,
    alignment: { horizontal: alignment, vertical: 'center', wrapText: true },
    border: {
      bottom: { style: 'thin', color: { rgb: BORDER_COLOR } },
      right: { style: 'thin', color: { rgb: GRID_COLOR } },
    },
  };
  DATA_CELL_STYLES.set(key, style);
  return style;
}

export function createStyledJsonSheet(
  XLSX: typeof XLSXType,
  rows: SheetRow[],
  options: StyledSheetOptions
) {
  const dataRows = normalizeRows(rows, options.emptyMessage);
  assertExcelRowLimit(dataRows.length);

  const headers = getHeaders(dataRows);
  if (headers.length === 0) headers.push('Aviso');
  const titleRows = [[options.title], [options.subtitle || `Gerado em ${new Date().toLocaleString('pt-BR')}`], []];
  const headerRowIndex = 3;
  const ws = XLSX.utils.aoa_to_sheet(titleRows);
  XLSX.utils.sheet_add_aoa(ws, [headers], { origin: { r: headerRowIndex, c: 0 } });
  XLSX.utils.sheet_add_json(ws, dataRows, {
    header: headers,
    skipHeader: true,
    origin: { r: headerRowIndex + 1, c: 0 },
  });
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  const themeColor = EXCEL_THEME_COLORS[options.theme || 'blue'];

  if (headers.length > 1) {
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
    ];
  }

  ws['!autofilter'] = {
    ref: XLSX.utils.encode_range({ s: { r: headerRowIndex, c: 0 }, e: range.e }),
  };
  ws['!freeze'] = { xSplit: 0, ySplit: headerRowIndex + 1 };
  const rowHeights = new Array(range.e.r + 1);
  rowHeights[0] = { hpt: 36 };
  rowHeights[1] = { hpt: 22 };
  rowHeights[headerRowIndex] = { hpt: 30 };
  rowHeights.fill(DATA_ROW_HEIGHT, headerRowIndex + 1);
  ws['!rows'] = rowHeights;
  ws['!cols'] = calculateRecordColumnWidths(headers, dataRows);

  for (let row = 0; row <= range.e.r; row += 1) {
    for (let col = 0; col <= range.e.c; col += 1) {
      const cell = ws[cellAddress(XLSX, row, col)];
      if (!cell) continue;

      if (row === 0) {
        cell.s = {
          font: { bold: true, sz: 20, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: themeColor } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: themeColor } },
            bottom: { style: 'thin', color: { rgb: themeColor } },
          },
        };
      } else if (row === 1) {
        cell.s = {
          font: { italic: true, color: { rgb: '64748B' } },
          fill: { fgColor: { rgb: 'F8FAFC' } },
          alignment: { horizontal: 'center', vertical: 'center' },
        };
      } else if (row === headerRowIndex) {
        cell.s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: themeColor } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: {
            top: { style: 'thin', color: { rgb: themeColor } },
            bottom: { style: 'medium', color: { rgb: themeColor } },
          },
        };
      } else if (row > headerRowIndex) {
        const isEven = (row - headerRowIndex) % 2 === 0;
        const header = headers[col] || '';
        const isNumeric = typeof cell.v === 'number';
        const highlightCell = options.highlightFirstColumn && col === 0;
        const alignment = col === 0 ? 'left' : isNumeric ? 'right' : 'center';
        cell.s = getDataCellStyle(isEven, Boolean(highlightCell), alignment);
        cell.z = getCellFormat(header, cell.v);
      }
    }
  }

  return ws;
}

export function appendStyledJsonSheet(
  XLSX: typeof XLSXType,
  workbook: XLSXType.WorkBook,
  rows: SheetRow[],
  sheetName: string,
  options: StyledSheetOptions
) {
  const ws = createStyledJsonSheet(XLSX, rows, options);
  const safeSheetName = sanitizeSheetName(sheetName);
  XLSX.utils.book_append_sheet(workbook, ws, safeSheetName);

  const sheet = workbook.Workbook?.Sheets?.find((item) => item.name === safeSheetName);
  if (sheet) {
    (sheet as typeof sheet & { TabColor?: { rgb: string } }).TabColor = {
      rgb: EXCEL_THEME_COLORS[options.theme || 'blue'],
    };
  }
}

export function applyWorkbookMetadata(workbook: XLSXType.WorkBook, title: string) {
  workbook.Props = {
    Title: title,
    Subject: 'Exportacao do Dashboard Geral',
    Author: 'Dashboard Geral',
    Company: 'Dashboard Geral',
    CreatedDate: new Date(),
  };
}

type FreezePane = { xSplit?: number; ySplit?: number };
type WorksheetWithFreeze = XLSXType.WorkSheet & { '!freeze'?: FreezePane };

function excelColumnName(columnNumber: number) {
  let current = Math.max(1, Math.trunc(columnNumber));
  let name = '';

  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }

  return name;
}

function addFreezePaneToWorksheet(xml: string, freeze: FreezePane) {
  const xSplit = Math.max(0, Math.trunc(freeze.xSplit || 0));
  const ySplit = Math.max(0, Math.trunc(freeze.ySplit || 0));
  if (xSplit === 0 && ySplit === 0) return xml;

  const activePane = xSplit > 0
    ? ySplit > 0 ? 'bottomRight' : 'topRight'
    : 'bottomLeft';
  const topLeftCell = `${excelColumnName(xSplit + 1)}${ySplit + 1}`;
  const paneAttributes = [
    xSplit > 0 ? `xSplit="${xSplit}"` : '',
    ySplit > 0 ? `ySplit="${ySplit}"` : '',
    `topLeftCell="${topLeftCell}"`,
    `activePane="${activePane}"`,
    'state="frozen"',
  ].filter(Boolean).join(' ');
  const freezeXml = `<pane ${paneAttributes}/><selection pane="${activePane}" activeCell="${topLeftCell}" sqref="${topLeftCell}"/>`;

  const sheetViewsStart = xml.indexOf('<sheetViews');
  if (sheetViewsStart < 0) {
    const insertAt = xml.search(/<(?:sheetFormatPr|cols|sheetData)\b/);
    if (insertAt < 0) throw new Error('O XLSX gerado não contém uma posição válida para congelar o cabeçalho.');
    const sheetViewsXml = `<sheetViews><sheetView workbookViewId="0">${freezeXml}</sheetView></sheetViews>`;
    return `${xml.slice(0, insertAt)}${sheetViewsXml}${xml.slice(insertAt)}`;
  }

  const sheetViewsOpenEnd = xml.indexOf('>', sheetViewsStart);
  if (sheetViewsOpenEnd < 0) throw new Error('A planilha XLSX gerada contém XML inválido.');
  const isSelfClosingSheetViews = xml[sheetViewsOpenEnd - 1] === '/';
  const sheetViewsClose = isSelfClosingSheetViews ? -1 : xml.indexOf('</sheetViews>', sheetViewsOpenEnd);
  const sheetViewsEnd = isSelfClosingSheetViews
    ? sheetViewsOpenEnd + 1
    : sheetViewsClose < 0 ? -1 : sheetViewsClose + '</sheetViews>'.length;
  if (sheetViewsEnd <= sheetViewsOpenEnd) throw new Error('A planilha XLSX gerada contém XML inválido.');

  const sheetViewsXml = xml.slice(sheetViewsStart, sheetViewsEnd);
  const sheetViewOpen = sheetViewsXml.match(/<sheetView\b[^>]*>/)?.[0];
  if (!sheetViewOpen) {
    const openEnd = sheetViewsXml.indexOf('>');
    const viewsOpenTag = sheetViewsXml.slice(0, openEnd + 1);
    const sheetViewXml = `<sheetView workbookViewId="0">${freezeXml}</sheetView>`;
    const nextSheetViewsXml = isSelfClosingSheetViews
      ? `${viewsOpenTag.slice(0, -2)}>${sheetViewXml}</sheetViews>`
      : `${viewsOpenTag}${sheetViewXml}${sheetViewsXml.slice(openEnd + 1)}`;
    return `${xml.slice(0, sheetViewsStart)}${nextSheetViewsXml}${xml.slice(sheetViewsEnd)}`;
  }

  const viewStart = sheetViewsXml.indexOf(sheetViewOpen);
  const viewOpenEnd = viewStart + sheetViewOpen.length;
  const isSelfClosingSheetView = sheetViewOpen.endsWith('/>');
  const viewEnd = isSelfClosingSheetView
    ? viewOpenEnd
    : sheetViewsXml.indexOf('</sheetView>', viewOpenEnd) + '</sheetView>'.length;
  if (viewEnd < viewOpenEnd) throw new Error('A planilha XLSX gerada contém uma visualização inválida.');

  const viewContent = isSelfClosingSheetView ? '' : sheetViewsXml.slice(viewOpenEnd, viewEnd - '</sheetView>'.length);
  const remainingContent = viewContent
    .replace(/<(?:pane|selection)\b[^>]*\/>/g, '')
    .replace(/<(pane|selection)\b[^>]*>[\s\S]*?<\/\1>/g, '');
  const normalizedOpenTag = isSelfClosingSheetView ? `${sheetViewOpen.slice(0, -2)}>` : sheetViewOpen;
  const nextSheetView = `${normalizedOpenTag}${freezeXml}${remainingContent}</sheetView>`;
  const nextSheetViewsXml = `${sheetViewsXml.slice(0, viewStart)}${nextSheetView}${sheetViewsXml.slice(viewEnd)}`;
  return `${xml.slice(0, sheetViewsStart)}${nextSheetViewsXml}${xml.slice(sheetViewsEnd)}`;
}

export async function writeWorkbookFile(
  XLSX: typeof XLSXType,
  workbook: XLSXType.WorkBook,
  filename: string
) {
  const freezePanes = workbook.SheetNames.map((sheetName, index) => ({
    path: `xl/worksheets/sheet${index + 1}.xml`,
    freeze: (workbook.Sheets[sheetName] as WorksheetWithFreeze | undefined)?.['!freeze'],
  })).filter((sheet): sheet is { path: string; freeze: FreezePane } => Boolean(sheet.freeze));

  if (freezePanes.length === 0) {
    XLSX.writeFile(workbook, filename);
    return;
  }

  const workbookData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const input = workbookData instanceof Uint8Array
    ? workbookData
    : new Uint8Array(workbookData as ArrayBuffer);
  const { unzipSync, zipSync } = await import('fflate');
  const zipEntries = unzipSync(input);
  const decoder = new TextDecoder('utf-8');
  const encoder = new TextEncoder();

  freezePanes.forEach(({ path, freeze }) => {
    const worksheet = zipEntries[path];
    if (!worksheet) throw new Error(`Não foi possível localizar a planilha ${path} no arquivo XLSX.`);
    zipEntries[path] = encoder.encode(addFreezePaneToWorksheet(decoder.decode(worksheet), freeze));
  });

  const output = zipSync(zipEntries, { level: 6 });
  const blob = new Blob([output.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
