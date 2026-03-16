
import React from 'react';
import { fetchMarketingTotalsData } from '@/utils/marketingDataFetcher';
import { generatePrintStyles } from '@/utils/apresentacao/printPageHelpers';
import { MarketingReportSlides } from './components/MarketingReportSlides';
import { createClient } from '@/utils/supabase/server';
import { safeRpc } from '@/lib/rpcWrapper';
import { redirect } from 'next/navigation';

import { Metadata } from 'next';

interface PageProps {
    searchParams: {
        praca?: string;
        dataInicial?: string;
        dataFinal?: string;
    };
}

export const metadata: Metadata = {
    title: "Apresentação Marketing",
};

export default async function MarketingPrintablePage({ searchParams }: PageProps) {
    const supabase = createClient();
    
    // 1. Verificar Autenticação e Role no Servidor
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
        redirect('/login');
    }

    const { data: profile } = await safeRpc<{ 
        role: string; is_admin: boolean; organization_id?: string | null;
    }>('get_current_user_profile', {}, { client: supabase });

    const isMarketing = profile?.role === 'marketing' || profile?.role === 'admin' || profile?.role === 'master' || profile?.is_admin;

    if (!isMarketing) {
        return (
            <div style={{ background: '#0f172a', color: 'white', padding: 48, textAlign: 'center', fontFamily: 'sans-serif', minHeight: '100vh' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Acesso Restrito</h1>
                <p>Você não tem permissão para acessar esta apresentação.</p>
            </div>
        );
    }

    // 2. Preparar Filtros
    const filters = {
        filtroLiberacao: { dataInicial: searchParams.dataInicial || null, dataFinal: searchParams.dataFinal || null },
        filtroEnviados: { dataInicial: searchParams.dataInicial || null, dataFinal: searchParams.dataFinal || null },
        filtroRodouDia: { dataInicial: searchParams.dataInicial || null, dataFinal: searchParams.dataFinal || null },
        filtroDataInicio: { dataInicial: searchParams.dataInicial || null, dataFinal: searchParams.dataFinal || null },
    };

    // 3. Buscar Dados
    const orgId = profile?.organization_id || null;
    const totals = await fetchMarketingTotalsData(filters as any, orgId, supabase);

    const pageStyle = generatePrintStyles();

    return (
        <div data-print-ready="true">
            <style dangerouslySetInnerHTML={{ __html: pageStyle }} />
            <MarketingReportSlides
                totals={totals}
                titulo="APRESENTAÇÃO MARKETING"
            />
        </div>
    );
}
