
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
    praca
}) => {
    const [activeTab, setActiveTab] = useState<'marketing' | 'operacional'>('marketing');

    // Use our custom hook
    const {
        data,
        loading,
        error,
        totalCount,
        handleLoadMore,
        getWeekRange,
        handleExport
    } = useMarketingDriverDetails({
        isOpen,
        semanaIso,
        organizationId,
        praca,
        activeTab
    });

    const { start, end } = getWeekRange(semanaIso);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Detalhes da Semana {semanaIso}</DialogTitle>
                    <DialogDescription>
                        {start} até {end} • {activeTab === 'marketing' ? 'Entregadores Marketing' : 'Entregadores Operacional'}
                        {totalCount > 0 && ` • Total: ${totalCount}`}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full flex-1 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                        <TabsList>
                            <TabsTrigger value="marketing">Marketing</TabsTrigger>
                            <TabsTrigger value="operacional">Operacional</TabsTrigger>
                        </TabsList>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                            disabled={loading}
                            className="gap-2"
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            Exportar Excel
                        </Button>
                    </div>

                    <TabsContent value="marketing" className="flex-1 overflow-auto border rounded-md relative">
                        <MarketingDriverTable
                            loading={loading}
                            error={error}
                            data={data}
                            totalCount={totalCount}
                            onLoadMore={handleLoadMore}
                        />
                    </TabsContent>

                    <TabsContent value="operacional" className="flex-1 overflow-auto border rounded-md relative">
                        <MarketingDriverTable
                            loading={loading}
                            error={error}
                            data={data}
                            totalCount={totalCount}
                            onLoadMore={handleLoadMore}
                        />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};
