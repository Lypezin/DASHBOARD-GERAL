import React from 'react';
import { Metadata } from 'next';
import {
    fetchMarketingCitiesData,
    fetchMarketingDailyEvolution,
    fetchMarketingWeeklyComparison,
    fetchMarketingCostsComparison,
    fetchMarketingWeeklyComparisonByCity,
} from '@/utils/marketingDataFetcher';
import { generatePrintStyles } from '@/utils/apresentacao/printPageHelpers';
import { MarketingReportSlides } from './components/MarketingReportSlides';
import { MARKETING_PRESENTATION_WEEKLY_CITIES } from '@/constants/marketing';
import { loadCurrentUserProfile } from '@/app/api/_shared/currentUserProfile';
import { createServiceRoleClient } from '@/utils/supabase/admin';

interface PageProps {
    searchParams: {
        praca?: string;
        dataInicial?: string;
        dataFinal?: string;
    };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
    title: 'Apresentacao Marketing',
};

function renderAccessRestricted(message: string) {
    return (
        <div style={{ background: '#0f172a', color: 'white', padding: 48, textAlign: 'center', fontFamily: 'sans-serif', minHeight: '100vh' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Acesso Restrito</h1>
            <p>{message}</p>
        </div>
    );
}

export default async function MarketingPrintablePage({ searchParams }: PageProps) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return renderAccessRestricted('Configuracao do Supabase indisponivel neste ambiente.');
    }

    const profileResult = await loadCurrentUserProfile({ requireApproved: true });

    if ('failure' in profileResult) {
        return renderAccessRestricted(profileResult.failure.message);
    }

    const profile = profileResult.profile as {
        role?: string;
        is_admin?: boolean;
        organization_id?: string | null;
    } | null;

    if (!profile) {
        return renderAccessRestricted('Nao foi possivel validar seu perfil agora.');
    }

    const isMarketing =
        profile.role === 'marketing' ||
        profile.role === 'admin' ||
        profile.role === 'master' ||
        profile.is_admin;

    if (!isMarketing) {
        return renderAccessRestricted('Voce nao tem permissao para acessar esta apresentacao.');
    }

    const canAccessAllOrganizations =
        profile.role === 'admin' ||
        profile.role === 'master' ||
        Boolean(profile.is_admin);

    if (!profile.organization_id && !canAccessAllOrganizations) {
        return renderAccessRestricted('Seu perfil de Marketing nao esta vinculado a uma organizacao.');
    }

    const today = new Date();
    const toIsoDate = (date: Date) => [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
    ].join('-');
    const unifiedDateFilter = {
        dataInicial: searchParams.dataInicial || toIsoDate(new Date(today.getFullYear(), today.getMonth(), 1)),
        dataFinal: searchParams.dataFinal || toIsoDate(today),
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
    const orgId = profile.organization_id || null;
    // O acesso e a organização já foram validados acima. Usar o cliente
    // server-only evita que políticas RLS inconsistentes deixem slides vazios,
    // mantendo todas as consultas explicitamente limitadas à organização.
    const supabase = createServiceRoleClient();

    const [citiesData, evolutionData, generalWeeklyData, costsComparison, weeklyDataByCity] = await Promise.all([
        fetchMarketingCitiesData(filters as any, orgId, supabase, true),
        fetchMarketingDailyEvolution(filters as any, orgId, supabase),
        fetchMarketingWeeklyComparison(orgId, null, dateInicial, dateFinal, supabase),
        fetchMarketingCostsComparison(filters as any, orgId, supabase),
        fetchMarketingWeeklyComparisonByCity(
            orgId,
            MARKETING_PRESENTATION_WEEKLY_CITIES as unknown as string[],
            dateInicial,
            dateFinal,
            supabase
        ),
    ]);

    const pageStyle = generatePrintStyles();
    const formatarData = (date?: string) => {
        if (!date) return '';
        const parts = date.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            return new Date(year, month, day).toLocaleDateString('pt-BR', { month: 'long', day: 'numeric' });
        }
        return new Date(date).toLocaleDateString('pt-BR', { month: 'long', day: 'numeric' });
    };
    const periodoFormatado = `${formatarData(filters.filtroEnviados.dataInicial)} a ${formatarData(filters.filtroEnviados.dataFinal || undefined)}`;

    return (
        <div>
            <style dangerouslySetInnerHTML={{ __html: pageStyle }} />
            <MarketingReportSlides
                citiesData={citiesData}
                evolutionData={evolutionData}
                weeklyData={generalWeeklyData as any}
                weeklyDataByCity={weeklyDataByCity as any}
                costsComparison={costsComparison}
                titulo="APRESENTACAO MARKETING"
                periodoFormatado={periodoFormatado}
            />
        </div>
    );
}
