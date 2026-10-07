import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { ArrowUpDown, ArrowUp, ArrowDown, DollarSign } from 'lucide-react';
import { ValoresEntregador } from '@/types';
import { ValoresTableRow } from './components/ValoresTableRow';
import { useInfiniteScroll } from '@/hooks/ui/useInfiniteScroll';

interface ValoresTableProps {
    sortedValores: ValoresEntregador[];
    sortField: keyof ValoresEntregador;
    sortDirection: 'asc' | 'desc';
    onSort: (field: keyof ValoresEntregador) => void;
    formatarReal: (valor: number | null | undefined) => string;
    isDetailed?: boolean;
    isUpdating?: boolean;
    onLoadMore?: () => void;
    hasMore?: boolean;
    isLoadingMore?: boolean;
    searchTerm?: string;
    onClearSearch?: () => void;
}

interface ValoresSortableHeaderProps {
    field: keyof ValoresEntregador;
    label: string;
    sortField: keyof ValoresEntregador;
    sortDirection: 'asc' | 'desc';
    onSort: (field: keyof ValoresEntregador) => void;
    align?: 'left' | 'right';
    className?: string;
}

const ValoresSortIcon = React.memo(function ValoresSortIcon({
    field,
    sortField,
    sortDirection,
}: Pick<ValoresSortableHeaderProps, 'field' | 'sortField' | 'sortDirection'>) {
    if (sortField !== field) {
        return <ArrowUpDown className="ml-1 h-3 w-3 text-slate-400" aria-hidden="true" />;
    }

    return sortDirection === 'asc'
        ? <ArrowUp className="ml-1 h-3 w-3 text-[#1c5e81] dark:text-sky-200" aria-hidden="true" />
        : <ArrowDown className="ml-1 h-3 w-3 text-[#1c5e81] dark:text-sky-200" aria-hidden="true" />;
});

const ValoresSortableHeader = React.memo(function ValoresSortableHeader({
    field,
    label,
    sortField,
    sortDirection,
    onSort,
    align = 'left',
    className = ''
}: ValoresSortableHeaderProps) {
    const ariaSort = sortField === field
        ? (sortDirection === 'asc' ? 'ascending' : 'descending')
        : 'none';

    return (
        <TableHead
            aria-sort={ariaSort}
            className={`p-0 text-slate-600 transition-colors hover:bg-[#eaf2f7] dark:text-slate-300 dark:hover:bg-slate-800 ${className}`}
        >
            <button
                type="button"
                onClick={() => onSort(field)}
                className={`flex min-h-11 w-full items-center gap-2 px-4 text-left text-[12px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-600 ${
                    align === 'right' ? 'justify-end text-right' : ''
                }`}
                aria-label={`Ordenar por ${label}, ${
                    sortField === field
                        ? (sortDirection === 'asc' ? 'crescente' : 'decrescente')
                        : 'sem ordenação ativa'
                }`}
            >
                {label}
                <ValoresSortIcon field={field} sortField={sortField} sortDirection={sortDirection} />
            </button>
        </TableHead>
    );
});

const noopLoadMore = () => {};

export const ValoresTable = React.memo(function ValoresTable({
    sortedValores,
    sortField,
    sortDirection,
    onSort,
    formatarReal,
    isDetailed,
    isUpdating = false,
    onLoadMore,
    hasMore,
    isLoadingMore,
    searchTerm = '',
    onClearSearch,
}: ValoresTableProps) {
    const lastElementRef = useInfiniteScroll(onLoadMore || noopLoadMore, hasMore || false, isLoadingMore || false);

    return (
            <div aria-busy={isUpdating} className="subtle-scrollbar overflow-x-auto overscroll-x-contain">
                <Table className={isDetailed ? "min-w-[920px]" : "min-w-[720px]"}>
                    <TableHeader>
                        <TableRow className="border-b border-[#d8e4eb] bg-[#f2f7fa] dark:border-slate-800 dark:bg-[#101c26]">
                            <ValoresSortableHeader field="nome_entregador" label="Entregador" sortField={sortField} sortDirection={sortDirection} onSort={onSort} className="w-[300px]" />
                            {isDetailed ? (
                                <>
                                    <ValoresSortableHeader field="turno" label="Turno" sortField={sortField} sortDirection={sortDirection} onSort={onSort} />
                                    <ValoresSortableHeader field="sub_praca" label="Sub-pra\u00e7a" sortField={sortField} sortDirection={sortDirection} onSort={onSort} />
                                </>
                            ) : null}
                            <ValoresSortableHeader field="total_taxas" label="Total" sortField={sortField} sortDirection={sortDirection} onSort={onSort} align="right" />
                            <ValoresSortableHeader field="numero_corridas_aceitas" label="Corridas" sortField={sortField} sortDirection={sortDirection} onSort={onSort} align="right" />
                            <ValoresSortableHeader field="taxa_media" label="Média" sortField={sortField} sortDirection={sortDirection} onSort={onSort} align="right" className="pr-6" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedValores.length > 0 ? (
                            <>
                                {sortedValores.map((entregador, index) => (
                                    entregador ? (
                                        <ValoresTableRow
                                            key={isDetailed
                                                ? `${entregador.id_entregador}-${entregador.turno || 'sem-turno'}-${entregador.sub_praca || 'sem-subpraca'}`
                                                : `${entregador.id_entregador}`
                                            }
                                            entregador={entregador}
                                            ranking={index + 1}
                                            formatarReal={formatarReal}
                                            isDetailed={isDetailed}
                                        />
                                    ) : null
                                ))}

                                {hasMore ? (
                                    <TableRow>
                                        <TableCell colSpan={isDetailed ? 6 : 4} className="h-12 py-4 text-center">
                                            <div ref={lastElementRef} className="flex items-center justify-center gap-2 text-slate-500">
                                                {isLoadingMore
                                                    ? <>
                                                        <div className="h-4 w-4 motion-safe:animate-spin rounded-full border-2 border-[#d6e3ea] border-t-[#347ca3] dark:border-slate-700 dark:border-t-sky-200" />
                                                        <span className="sr-only">Carregando mais resultados</span>
                                                    </>
                                                    : <span className="text-xs">Role para carregar mais resultados</span>}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : null}
                            </>
                        ) : isUpdating ? (
                            <TableRow>
                                <TableCell colSpan={isDetailed ? 6 : 4} className="px-4 py-4">
                                    <div role="status" aria-busy="true" aria-label="Atualizando valores" className="space-y-4">
                                        {Array.from({ length: 4 }, (_, row) => (
                                            <div
                                                key={`loading-${row}`}
                                                aria-hidden="true"
                                                className="grid items-center gap-4"
                                                style={{
                                                    gridTemplateColumns: `repeat(${isDetailed ? 6 : 4}, minmax(0, 1fr))`,
                                                }}
                                            >
                                                {(isDetailed
                                                    ? ['62%', '54%', '58%', '46%', '42%', '44%']
                                                    : ['62%', '48%', '43%', '46%']
                                                ).map((width, column) => (
                                                    <div
                                                        key={column}
                                                        className="h-4 max-w-full animate-pulse rounded bg-slate-100 motion-reduce:animate-none dark:bg-slate-800"
                                                        style={{ width }}
                                                    />
                                                ))}
                                            </div>
                                        ))}
                                        <span className="sr-only">Atualizando valores com os filtros atuais.</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            <TableRow>
                                <TableCell colSpan={isDetailed ? 6 : 4} className="px-4 py-12 text-center">
                                    <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#eaf4f9] text-[#347ca3] dark:bg-sky-950/50 dark:text-sky-200">
                                        <DollarSign className="h-4 w-4" aria-hidden="true" />
                                    </div>
                                    <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                        {searchTerm.trim()
                                            ? `Nenhum entregador encontrado para “${searchTerm.trim()}”.`
                                            : 'Nenhum valor neste recorte.'}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {searchTerm.trim() ? 'Revise o termo pesquisado ou limpe a busca.' : 'Ajuste os filtros ou o período selecionado.'}
                                    </p>
                                    {searchTerm.trim() && onClearSearch ? (
                                        <button
                                            type="button"
                                            onClick={onClearSearch}
                                            className="mt-3 rounded-md px-2 py-1 text-xs font-semibold text-[#1c5e81] underline underline-offset-2 transition-colors hover:text-[#123f5a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30 dark:text-sky-200 dark:hover:text-sky-100"
                                        >
                                            Limpar busca
                                        </button>
                                    ) : null}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
    );
});
