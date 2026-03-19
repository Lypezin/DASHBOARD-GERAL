
import React from 'react';
import { fetchMarketingTotalsData, fetchMarketingCitiesData, fetchMarketingDailyEvolution, fetchMarketingWeeklyComparison, fetchMarketingCostsComparison } from '@/utils/marketingDataFetcher';
import { generatePrintStyles } from '@/utils/apresentacao/printPageHelpers';
import { MarketingReportSlides } from './components/MarketingReportSlides';
import { createClient } from '@/utils/supabase/server';
import { safeRpc } from '@/lib/rpcWrapper';
import { redirect } from 'next/navigation';
import { CIDADES } from '@/constants/marketing';

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
    const unifiedDateFilter = { 
        dataInicial: searchParams.dataInicial || null, 
        dataFinal: searchParams.dataFinal || null 
    };

    const filters = {
        filtroLiberacao: unifiedDateFilter,
        filtroEnviados: unifiedDateFilter,
        filtroRodouDia: unifiedDateFilter,
        filtroDataInicio: unifiedDateFilter,
        praca: searchParams.praca || null,
    };

    const dateInicial = unifiedDateFilter.dataInicial || null;
    const dateFinal = unifiedDateFilter.dataFinal || null;

    // 3. Buscar Dados
    const orgId = profile?.organization_id || null;
    
    // Buscar dados base
    const [totals, citiesData, evolutionData, generalWeeklyData, costsComparison] = await Promise.all([
        fetchMarketingTotalsData(filters as any, orgId, supabase),
        fetchMarketingCitiesData(filters as any, orgId, supabase, true),
        fetchMarketingDailyEvolution(filters as any, orgId, supabase),
        fetchMarketingWeeklyComparison(orgId, null, dateInicial, dateFinal, supabase),
        fetchMarketingCostsComparison(filters as any, orgId, supabase)
    ]);

    // Buscar comparativo semanal para cada cidade
    const weeklyDataByCity = await Promise.all(
        CIDADES.map(async (cidade) => {
            const data = await fetchMarketingWeeklyComparison(orgId, cidade, dateInicial, dateFinal, supabase);
            return { cidade, data };
        })
    );

    const pageStyle = generatePrintStyles();
    
    // Formatar período para a capa
    const formatarData = (d?: string) => d ? new Date(d).toLocaleDateString('pt-BR', { month: 'long', day: 'numeric' }) : '';
    const periodoFormatado = filters.filtroEnviados.dataInicial 
        ? `${formatarData(filters.filtroEnviados.dataInicial)} a ${formatarData(filters.filtroEnviados.dataFinal || undefined)}`
        : "Período Geral";

    return (
        <div data-print-ready="true">
            <style dangerouslySetInnerHTML={{ __html: pageStyle }} />
            <MarketingReportSlides
                totals={totals}
                citiesData={citiesData}
                evolutionData={evolutionData}
                weeklyData={generalWeeklyData as any}
                weeklyDataByCity={weeklyDataByCity as any}
                costsComparison={costsComparison}
                titulo="APRESENTAÇÃO MARKETING"
                periodoFormatado={periodoFormatado}
            />
        </div>
    );
}
