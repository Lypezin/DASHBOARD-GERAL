import type * as XLSXType from 'xlsx';

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
}

function normalizeRows(rows: SheetRow[], emptyMessage?: string) {
  return rows.length > 0 ? rows : [{ Aviso: emptyMessage || 'Sem dados para os filtros atuais' }];
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

export function createStyledJsonSheet(
  XLSX: typeof XLSXType,
  rows: SheetRow[],
  options: StyledSheetOptions
) {
  const dataRows = normalizeRows(rows, options.emptyMessage);
  const headers = getHeaders(dataRows);
  const titleRows = [[options.title], [options.subtitle || `Gerado em ${new Date().toLocaleString('pt-BR')}`], []];
  const tableRows = dataRows.map((row) => headers.map((header) => row[header] ?? ''));
  const ws = XLSX.utils.aoa_to_sheet([...titleRows, headers, ...tableRows]);
  const headerRowIndex = 3;
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
  ws['!rows'] = Array.from({ length: range.e.r + 1 }, (_, index) => ({
    hpt: index === 0 ? 30 : index === headerRowIndex ? 24 : 20,
  }));
  ws['!cols'] = headers.map((header, colIndex) => {
    const maxLength = Math.max(
      header.length,
      ...dataRows.map((row) => String(row[header] ?? '').length)
    );
    return { wch: Math.min(Math.max(maxLength + 3, colIndex === 0 ? 18 : 12), 48) };
  });

  for (let row = 0; row <= range.e.r; row += 1) {
    for (let col = 0; col <= range.e.c; col += 1) {
      const cell = ws[cellAddress(XLSX, row, col)];
      if (!cell) continue;

      if (row === 0) {
        cell.s = {
          font: { bold: true, sz: 16, color: { rgb: themeColor } },
          alignment: { horizontal: 'center', vertical: 'center' },
        };
      } else if (row === 1) {
        cell.s = {
          font: { color: { rgb: '64748B' } },
          alignment: { horizontal: 'center', vertical: 'center' },
        };
      } else if (row === headerRowIndex) {
        cell.s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: themeColor } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        };
      } else if (row > headerRowIndex) {
        const isEven = (row - headerRowIndex) % 2 === 0;
        cell.s = {
          fill: isEven ? { fgColor: { rgb: 'F8FAFC' } } : undefined,
          alignment: { horizontal: col === 0 ? 'left' : 'center', vertical: 'center', wrapText: true },
          border: { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } },
        };
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
  XLSX.utils.book_append_sheet(workbook, ws, sheetName);

  const sheet = workbook.Workbook?.Sheets?.find((item) => item.name === sheetName);
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
