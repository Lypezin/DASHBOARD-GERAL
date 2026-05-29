import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet } from 'lucide-react';
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
            <DialogContent className="flex max-h-[88vh] w-[min(96vw,72rem)] flex-col overflow-hidden rounded-[1.75rem] border-slate-200/80 p-0 dark:border-slate-800/80">
                <DialogHeader className="border-b border-slate-100 px-5 py-5 text-left dark:border-slate-800 sm:px-6">
                    <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Detalhes da Semana {semanaIso}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
                        {start} ate {end} · {activeTab === 'marketing' ? 'Entregadores Marketing' : 'Entregadores Operacional'}
                        {totalCount > 0 && ` · Total: ${totalCount}`}
                    </DialogDescription>
                </DialogHeader>

                <Tabs
                    value={activeTab}
                    onValueChange={(v) => setActiveTab(v as 'marketing' | 'operacional')}
                    className="flex min-h-0 w-full flex-1 flex-col overflow-hidden"
                >
                    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800 sm:w-auto">
                            <TabsTrigger value="marketing" className="rounded-xl">
                                Marketing
                            </TabsTrigger>
                            <TabsTrigger value="operacional" className="rounded-xl">
                                Operacional
                            </TabsTrigger>
                        </TabsList>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                            disabled={loading}
                            className="w-full gap-2 sm:w-auto"
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            Exportar Excel
                        </Button>
                    </div>

                    <div className="min-h-0 flex-1 px-5 pb-5 sm:px-6 sm:pb-6">
                        <TabsContent value="marketing" className="mt-0 h-full min-h-0 rounded-2xl border border-slate-200/80 bg-white/85 dark:border-slate-800/80 dark:bg-slate-900/70">
                            <MarketingDriverTable
                                loading={loading}
                                error={error}
                                data={data}
                                totalCount={totalCount}
                                onLoadMore={handleLoadMore}
                            />
                        </TabsContent>

                        <TabsContent value="operacional" className="mt-0 h-full min-h-0 rounded-2xl border border-slate-200/80 bg-white/85 dark:border-slate-800/80 dark:bg-slate-900/70">
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
