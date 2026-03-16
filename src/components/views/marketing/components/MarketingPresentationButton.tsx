'use client';

import React from 'react';
import { Presentation, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHeaderAuth } from '@/hooks/auth/useHeaderAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function MarketingPresentationButton() {
    const { user, isLoading } = useHeaderAuth();
    const router = useRouter();

    const isMarketing = user?.role === 'marketing' || user?.role === 'admin' || user?.role === 'master' || user?.is_admin;

    const handleOpenPresentation = () => {
        if (!isMarketing) {
            toast.error('Acesso restrito', {
                description: 'Apenas usuários do Marketing podem gerar esta apresentação.'
            });
            return;
        }
        
        // Redireciona para a nova página de apresentação de marketing
        router.push('/apresentacao/marketing');
    };

    if (isLoading) return null;

    return (
        <Button
            onClick={handleOpenPresentation}
            variant="outline"
            className={`
                flex items-center gap-2 font-semibold transition-all duration-300
                ${isMarketing 
                    ? 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-300 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400' 
                    : 'opacity-70 cursor-not-allowed hover:bg-transparent'}
            `}
        >
            {isMarketing ? <Presentation className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            Gerar Apresentação
        </Button>
    );
}
