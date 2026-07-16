'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHeaderAuth } from '@/hooks/auth/useHeaderAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';
import { PresentationHeader } from './components/PresentationHeader';
import { PresentationConfigCard } from './components/PresentationConfigCard';

const MarketingPresentationView = React.memo(function MarketingPresentationView() {
    const { user, isLoading } = useHeaderAuth();
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [presentationFilters, setPresentationFilters] = useState<{
        dataInicial: string | null;
        dataFinal: string | null;
    }>(() => {
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
    });
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

    const periodLabel =
        presentationFilters.dataInicial || presentationFilters.dataFinal
            ? `${formatDate(presentationFilters.dataInicial) || '...'} - ${formatDate(presentationFilters.dataFinal) || '...'} `
            : 'Todo o per\u00edodo';

    const handleOpenPresentation = () => {
        if (!isMarketing) {
            toast.error('Acesso restrito', {
                description: 'Apenas usu\u00e1rios do Marketing podem acessar esta apresenta\u00e7\u00e3o.',
            });
            return;
        }
        setIsGenerating(true);
        const params = new URLSearchParams();
        if (presentationFilters.dataInicial) params.set('dataInicial', presentationFilters.dataInicial);
        if (presentationFilters.dataFinal) params.set('dataFinal', presentationFilters.dataFinal);
        router.push(`/apresentacao/marketing?${params.toString()}`);
    };

    if (isLoading) return null;

    return (
        <div className="relative space-y-8 overflow-hidden pb-12 pt-4 motion-safe:animate-fade-in">
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
