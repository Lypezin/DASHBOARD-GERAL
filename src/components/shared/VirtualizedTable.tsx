/**
 * Componente de tabela virtualizada usando react-window
 * 
 * ⚠️ NOTA: Este componente foi criado como base para virtualização de tabelas grandes.
 * Para usar, é necessário:
 * 1. Instalar @types/react-window se necessário
 * 2. Ajustar altura de linha conforme necessário
 * 3. Testar com dados reais
 * 
 * Benefícios:
 * - Renderiza apenas linhas visíveis (reduz DOM nodes em 90-95%)
 * - Melhor performance com listas grandes (centenas/milhares de linhas)
 * - Scroll suave mesmo com muitos dados
 */

import React from 'react';
// @ts-ignore - react-window types may not be fully compatible
import { FixedSizeList } from 'react-window';

interface VirtualizedTableProps<T> {
  data: T[];
  rowHeight?: number;
  tableHeight?: number;
  renderRow: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  renderHeader: () => React.ReactNode;
  emptyMessage?: string;
}

export function VirtualizedTable<T>({
  data,
  rowHeight = 60,
  tableHeight = 600,
  renderRow,
  renderHeader,
  emptyMessage = 'Nenhum dado disponível',
}: VirtualizedTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = data[index];
    return <div style={style}>{renderRow(item, index, style)}</div>;
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          {renderHeader()}
          <tbody>
            {/* Tabela virtualizada será renderizada aqui */}
            <tr>
              <td colSpan={10}>
                <FixedSizeList
                  height={tableHeight}
                  itemCount={data.length}
                  itemSize={rowHeight}
                  width="100%"
                >
                  {Row}
                </FixedSizeList>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * ⚠️ NOTA DE IMPLEMENTAÇÃO:
 * 
 * A virtualização de tabelas HTML é mais complexa que virtualização de listas simples.
 * Para uma implementação completa, considere:
 * 
 * 1. Usar uma biblioteca especializada como:
 *    - react-table (TanStack Table) com virtualização
 *    - ag-grid (comercial, mas muito completo)
 *    - react-virtual (mais moderno que react-window)
 * 
 * 2. Ou implementar virtualização customizada:
 *    - Renderizar apenas linhas visíveis no viewport
 *    - Usar position: absolute para posicionamento
 *    - Manter header fixo
 * 
 * 3. Para tabelas com menos de 100-200 linhas, virtualização pode não ser necessária
 *    e pode até piorar a UX (scroll não nativo, etc.)
 * 
 * RECOMENDAÇÃO:
 * - Implementar virtualização apenas se houver problemas de performance comprovados
 * - Testar com dados reais antes de implementar
 * - Considerar paginação como alternativa mais simples
 */

