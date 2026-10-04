'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHeaderAuth } from '@/hooks/auth/useHeaderAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';
import { PresentationHeader } from './components/PresentationHeader';
import { PresentationConfigCard } from './components/PresentationConfigCard';
import { Skeleton } from '@/components/ui/skeleton';

function getCurrentMonthPeriod() {
    const today = new Date();
    const toIsoDate = (date: Date) => [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
    ].join('-');

    return {
        dataInicial: toIsoDate(new Date(today.getFullYear(), today.getMonth(), 1)),
        dataFinal: toIsoDate(today),
    };
}

const MarketingPresentationView = React.memo(function MarketingPresentationView() {
    const { user, isLoading } = useHeaderAuth();
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [presentationFilters, setPresentationFilters] = useState<{
        dataInicial: string | null;
        dataFinal: string | null;
    }>(() => getCurrentMonthPeriod());
    const [isGenerating, setIsGenerating] = useState(false);
    const isMarketing = !!(
        user?.role === 'marketing' ||
        user?.role === 'admin' ||
        user?.role === 'master' ||
        user?.is_admin
    );

    const formatDate = (date?: string | null) => {
        if (!date) return null;
        try {
            if (date.includes('-')) {
                const parts = date.split('-');
                if (parts.length === 3) {
                    return `${parts[2]}/${parts[1]}`;
                }
            }
            return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        } catch {
            return date;
        }
    };

    const effectivePeriod = presentationFilters.dataInicial || presentationFilters.dataFinal
        ? presentationFilters
        : getCurrentMonthPeriod();
    const periodLabel = `${formatDate(effectivePeriod.dataInicial) || '...'} - ${formatDate(effectivePeriod.dataFinal) || '...'}`;

    const handleOpenPresentation = () => {
        if (!isMarketing) {
            toast.error('Acesso restrito', {
                description: 'Apenas usu\u00e1rios do Marketing podem acessar esta apresenta\u00e7\u00e3o.',
            });
            return;
        }
        setIsGenerating(true);
        if (!presentationFilters.dataInicial && !presentationFilters.dataFinal) {
            setPresentationFilters(effectivePeriod);
        }
        const params = new URLSearchParams();
        if (effectivePeriod.dataInicial) params.set('dataInicial', effectivePeriod.dataInicial);
        if (effectivePeriod.dataFinal) params.set('dataFinal', effectivePeriod.dataFinal);
        router.push(`/apresentacao/marketing?${params.toString()}`);
    };

    if (isLoading) {
        return (
            <div
                aria-busy="true"
                aria-label="Carregando apresentação de Marketing"
                className="relative space-y-8 overflow-hidden pb-12 pt-4"
            >
                <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-500/10 blur-[100px]" />
                <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-sky-500/10 blur-[100px]" />
                <div role="status" className="relative z-10 space-y-6">
                    <div className="flex flex-col items-center gap-3 md:flex-row md:justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-64" />
                            <Skeleton className="h-4 w-80 max-w-full" />
                        </div>
                        <Skeleton className="h-11 w-40 rounded-xl" />
                    </div>
                    <div className="mx-auto w-full max-w-2xl rounded-[2rem] bg-white/70 p-6 shadow-xl ring-1 ring-slate-200/50 dark:bg-slate-900/60 dark:ring-white/10 sm:p-8">
                        <Skeleton className="mx-auto h-7 w-56" />
                        <Skeleton className="mx-auto mt-3 h-4 w-72 max-w-full" />
                        <Skeleton className="mx-auto mt-8 h-12 w-full max-w-sm rounded-xl" />
                        <Skeleton className="mt-8 h-10 w-full rounded-xl" />
                        <Skeleton className="mt-6 h-16 w-full rounded-2xl" />
                    </div>
                    <span className="sr-only">Validando acesso...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="relative space-y-8 overflow-hidden pb-12 pt-4">
            <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-500/10 blur-[100px]" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-sky-500/10 blur-[100px]" />

            <PresentationHeader
                isDark={isDark}
                isMarketing={isMarketing}
                isGenerating={isGenerating}
                onGenerate={handleOpenPresentation}
            />

            <div className="relative z-10 flex justify-center">
                <div className="w-full max-w-2xl space-y-6">
                    <PresentationConfigCard
                        isDark={isDark}
                        isMarketing={isMarketing}
                        isGenerating={isGenerating}
                        filters={presentationFilters}
                        setFilters={setPresentationFilters}
                        onGenerate={handleOpenPresentation}
                        periodLabel={periodLabel}
                    />
                </div>
            </div>
        </div>
    );
});

MarketingPresentationView.displayName = 'MarketingPresentationView';

export default MarketingPresentationView;
