'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Presentation } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    }>({
        dataInicial: null,
        dataFinal: null
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const isMarketing = !!(user?.role === 'marketing' || user?.role === 'admin' || user?.role === 'master' || user?.is_admin);

    const formatDate = (date?: string | null) => {
        if (!date) return null;
        try {
            // Se for do tipo YYYY-MM-DD, quebramos manualmente para evitar o fuso horário
            if (date.includes('-')) {
                const parts = date.split('-');
                if (parts.length === 3) {
                    return `${parts[2]}/${parts[1]}`;
                }
            }
            return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        } catch { return date; }
    };

    const periodLabel = presentationFilters.dataInicial || presentationFilters.dataFinal
        ? `${formatDate(presentationFilters.dataInicial) || '...'} – ${formatDate(presentationFilters.dataFinal) || '...'} `
        : 'Todo o período';

    const handleOpenPresentation = () => {
        if (!isMarketing) {
            toast.error('Acesso restrito', { description: 'Apenas usuários do Marketing podem acessar esta apresentação.' });
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
        <div className="space-y-8 animate-fade-in pb-12 pt-4 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

            <PresentationHeader 
                isDark={isDark} 
                isMarketing={isMarketing} 
                isGenerating={isGenerating} 
                onGenerate={handleOpenPresentation} 
            />

            <div className="flex justify-center relative z-10">
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
