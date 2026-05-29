
import React, { useEffect, useMemo, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, ArrowUpRight, ArrowDownRight, RotateCcw } from 'lucide-react';
import { MetricDetailList } from './MetricDetailList';
import { DesistenciasList } from './DesistenciasList';
import { safeRpc } from '@/lib/rpcWrapper';
import { RPC_TIMEOUTS } from '@/constants/config';
import { CITY_DB_MAPPING } from '@/constants/marketing';
import { getDateRangeFromWeek } from '@/utils/timeHelpers';

interface MetricDetailDialogProps {
    type: 'entradas' | 'saidas' | 'retomada';
    weekLabel: string;
    semanaIso?: string;
    organizationId?: string;
    praca?: string | null;
    count: number;
    marketingNames?: string[];
    operacionalNames?: string[];
    marketingNovosNames?: string[];
    operacionalNovosNames?: string[];
}

import { getMetricDialogConfig } from '../utils/getMetricDialogConfig';

export const MetricDetailDialog: React.FC<MetricDetailDialogProps> = ({
    type,
    weekLabel,
    semanaIso,
    organizationId,
    praca,
    count,
    marketingNames = [],
    operacionalNames = [],
    marketingNovosNames = [],
    operacionalNovosNames = []
}) => {
    const { colorClass, hoverBgClass, Icon, titleText, descriptionText, isEntrada } = getMetricDialogConfig(type);
    const [open, setOpen] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [detailsError, setDetailsError] = useState<string | null>(null);
    const [details, setDetails] = useState({
        marketingNames,
        operacionalNames,
        marketingNovosNames,
        operacionalNovosNames
    });

    const initialDetailsKey = useMemo(() => JSON.stringify({
        marketingNames,
        operacionalNames,
        marketingNovosNames,
        operacionalNovosNames
    }), [marketingNames, operacionalNames, marketingNovosNames, operacionalNovosNames]);

    useEffect(() => {
        setDetails({
            marketingNames,
            operacionalNames,
            marketingNovosNames,
            operacionalNovosNames
        });
        setDetailsError(null);
    }, [initialDetailsKey, marketingNames, operacionalNames, marketingNovosNames, operacionalNovosNames]);

    const hasNoRecords =
        !details.marketingNames.length &&
        !details.operacionalNames.length &&
        !details.marketingNovosNames.length &&
        !details.operacionalNovosNames.length;
    const hasNovos = details.marketingNovosNames.length > 0 || details.operacionalNovosNames.length > 0;

    useEffect(() => {
        if (!open || !hasNoRecords || count <= 0 || !semanaIso || !organizationId) return;

        const match = semanaIso.match(/^(\d{4})-W(\d{1,2})$/);
        if (!match) return;

        let cancelled = false;
        const fetchDetails = async () => {
            setLoadingDetails(true);
            setDetailsError(null);

            const [, yearText, weekText] = match;
            const range = getDateRangeFromWeek(Number(yearText), Number(weekText));
            const dbPraca = praca ? CITY_DB_MAPPING[praca] || praca : null;

            const { data, error } = await safeRpc<any[]>('get_fluxo_semanal', {
                p_data_inicial: range.start,
                p_data_final: range.end,
                p_organization_id: organizationId,
                p_praca: dbPraca,
                p_include_names: true
            }, {
                timeout: RPC_TIMEOUTS.LONG,
                validateParams: false
            });

            if (cancelled) return;

            if (error) {
                setDetailsError(error.message || 'Erro ao carregar nomes.');
                setLoadingDetails(false);
                return;
            }

            const rows = Array.isArray(data) ? data : [];
            const item = rows.find((row) => row?.semana === semanaIso) || rows[0];

            if (!item) {
                setDetailsError('Nenhum detalhe encontrado para esta semana.');
                setLoadingDetails(false);
                return;
            }

            setDetails(getDetailsFromFluxoItem(type, item));
            setLoadingDetails(false);
        };

        void fetchDetails();

        return () => {
            cancelled = true;
        };
    }, [count, hasNoRecords, open, organizationId, praca, semanaIso, type]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={`h-7 w-7 p-0 ${colorClass} hover:${colorClass.replace('text-', '')} ${hoverBgClass}`}
                >
                    <Eye className="h-3.5 w-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md p-0 gap-0 rounded-2xl">
                <DialogHeader className="p-5 pb-3">
                    <DialogTitle className={`flex items-center gap-2 ${colorClass}`}>
                        <Icon className="h-5 w-5" />
                        {titleText} - {weekLabel}
                    </DialogTitle>
                    <DialogDescription>
                        {count} {descriptionText}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] w-full px-5 pb-4">
                    <div className="space-y-4">
                        {loadingDetails && (
                            <div className="text-sm text-slate-500 text-center py-4">Carregando nomes...</div>
                        )}

                        {detailsError && (
                            <div className="text-sm text-rose-500 text-center py-4">{detailsError}</div>
                        )}

                        {!loadingDetails && !detailsError && hasNoRecords && (
                            <div className="text-sm text-slate-500 text-center py-4">Nenhum registro.</div>
                        )}

                        <MetricDetailList
                            title="Marketing"
                            items={details.marketingNames}
                            type="marketing"
                            isEntrada={isEntrada}
                        />

                        <MetricDetailList
                            title="Operacional"
                            items={details.operacionalNames}
                            type="operacional"
                            isEntrada={isEntrada}
                        />

                        {hasNovos && (
                            <DesistenciasList
                                marketingNovosNames={details.marketingNovosNames}
                                operacionalNovosNames={details.operacionalNovosNames}
                                isEntrada={isEntrada}
                            />
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

function getDetailsFromFluxoItem(type: 'entradas' | 'saidas' | 'retomada', item: any) {
    if (type === 'entradas') {
        return {
            marketingNames: item.nomes_entradas_mkt || [],
            operacionalNames: item.nomes_entradas_ops || [],
            marketingNovosNames: [],
            operacionalNovosNames: []
        };
    }

    if (type === 'retomada') {
        return {
            marketingNames: item.nomes_retomada_mkt || [],
            operacionalNames: item.nomes_retomada_ops || [],
            marketingNovosNames: [],
            operacionalNovosNames: []
        };
    }

    return {
        marketingNames: item.nomes_saidas_mkt || [],
        operacionalNames: item.nomes_saidas_ops || [],
        marketingNovosNames: item.nomes_saidas_novos_mkt || [],
        operacionalNovosNames: item.nomes_saidas_novos_ops || []
    };
}
