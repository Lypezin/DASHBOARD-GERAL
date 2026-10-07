import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { useMarketingDriverDetails } from './useMarketingDriverDetails';
import { MarketingDriverTable } from './MarketingDriverTable';

interface MarketingDriverDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    semanaIso: string;
    organizationId: string | null;
    praca?: string | null;
}

export const MarketingDriverDetailModal: React.FC<MarketingDriverDetailModalProps> = ({
    isOpen,
    onClose,
    semanaIso,
    organizationId,
    praca,
}) => {
    const [activeTab, setActiveTab] = useState<'marketing' | 'operacional'>('marketing');

    const {
        data,
        loading,
        error,
        totalCount,
        handleLoadMore,
        getWeekRange,
        handleExport,
        exportLoading,
    } = useMarketingDriverDetails({
        isOpen,
        semanaIso,
        organizationId,
        praca,
        activeTab,
    });

    const { start, end } = getWeekRange(semanaIso);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="flex max-h-[88vh] w-[96vw] max-w-[min(96vw,72rem)] flex-col overflow-hidden rounded-xl border-slate-200 p-0 dark:border-slate-800">
                <DialogHeader className="border-b border-slate-100 px-5 py-5 text-left dark:border-slate-800 sm:px-6">
                    <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Detalhes da Semana {semanaIso}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
                        {start} até {end} · {activeTab === 'marketing' ? 'Entregadores Marketing' : 'Entregadores Operacional'}
                        {totalCount > 0 && ` · Total: ${totalCount}`}
                    </DialogDescription>
                </DialogHeader>

                <Tabs
                    value={activeTab}
                    onValueChange={(v) => setActiveTab(v as 'marketing' | 'operacional')}
                    className="flex min-h-0 w-full flex-1 flex-col overflow-hidden"
                >
                    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <TabsList className="grid w-full grid-cols-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-800 sm:w-auto">
                            <TabsTrigger value="marketing" className="rounded-md">
                                Marketing
                            </TabsTrigger>
                            <TabsTrigger value="operacional" className="rounded-md">
                                Operacional
                            </TabsTrigger>
                        </TabsList>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                            disabled={loading || exportLoading}
                            className="w-full gap-2 sm:w-auto"
                        >
                            {exportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                            {exportLoading ? 'Preparando Excel...' : 'Exportar Excel'}
                        </Button>
                    </div>

                    <div className="min-h-0 flex-1 px-5 pb-5 sm:px-6 sm:pb-6">
                        <TabsContent value="marketing" className="mt-0 h-full min-h-0 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                            <MarketingDriverTable
                                loading={loading}
                                error={error}
                                data={data}
                                totalCount={totalCount}
                                onLoadMore={handleLoadMore}
                            />
                        </TabsContent>

                        <TabsContent value="operacional" className="mt-0 h-full min-h-0 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                            <MarketingDriverTable
                                loading={loading}
                                error={error}
                                data={data}
                                totalCount={totalCount}
                                onLoadMore={handleLoadMore}
                            />
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};
