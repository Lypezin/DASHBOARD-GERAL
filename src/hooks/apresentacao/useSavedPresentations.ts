import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MediaSlideData } from '@/types/presentation';
import { useOrganization } from '@/contexts/OrganizationContext';
import { safeLog } from '@/lib/errorHandler';

export interface SavedPresentation {
    id: string;
    name: string;
    slides: MediaSlideData[];
    sections: Record<string, boolean>;
    filters: any;
    created_at: string;
}

export function useSavedPresentations() {
    const { organization } = useOrganization();
    const [savedPresentations, setSavedPresentations] = useState<SavedPresentation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resolvedOrganizationId, setResolvedOrganizationId] = useState<string | null>(null);
    const resolvedOrganizationIdRef = useRef<string | null>(null);
    const requestIdRef = useRef(0);

    const fetchPresentations = useCallback(async () => {
        const requestId = ++requestIdRef.current;
        const organizationId = organization?.id || null;
        if (!organizationId) {
            resolvedOrganizationIdRef.current = null;
            setResolvedOrganizationId(null);
            setSavedPresentations([]);
            setError(null);
            setLoading(false);
            return;
        }

        const hasDataForOrganization = resolvedOrganizationIdRef.current === organizationId;
        if (!hasDataForOrganization) {
            setSavedPresentations([]);
            setError(null);
        }

        try {
            setLoading(true);
            setError(null);
            const { data: { user } } = await supabase.auth.getUser();
            if (requestId !== requestIdRef.current) return;
            let query = supabase.from('presentations').select('id, name, slides, sections, filters, created_at').eq('organization_id', organizationId);
            if (user?.id) query = query.contains('filters', { user_id: user.id });
            const { data, error } = await query.order('created_at', { ascending: false });
            if (requestId !== requestIdRef.current) return;
            if (error) throw error;
            if (!Array.isArray(data)) {
                throw new Error('A consulta de apresentações salvas retornou uma resposta inválida.');
            }
            resolvedOrganizationIdRef.current = organizationId;
            setResolvedOrganizationId(organizationId);
            setSavedPresentations(data);
        } catch (fetchError) {
            if (requestId !== requestIdRef.current) return;
            safeLog.error('Error fetching presentations:', fetchError);
            setError(fetchError instanceof Error ? fetchError.message : 'Não foi possível carregar as apresentações salvas.');
            if (!hasDataForOrganization) {
                resolvedOrganizationIdRef.current = organizationId;
                setResolvedOrganizationId(organizationId);
                setSavedPresentations([]);
            }
        } finally {
            if (requestId === requestIdRef.current) setLoading(false);
        }
    }, [organization?.id]);

    const savePresentation = useCallback(async (name: string, slides: MediaSlideData[], sections: Record<string, boolean>, filters: any) => {
        if (!organization?.id) return null;
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            const filtersWithUser = { ...filters, user_id: user?.id };
            const { data, error } = await supabase.from('presentations').insert({ organization_id: organization.id, name, slides, sections, filters: filtersWithUser }).select().single();
            if (error) throw error;
            await fetchPresentations();
            return data;
        } catch (error) {
            safeLog.error('Error saving presentation:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [organization?.id, fetchPresentations]);

    const deletePresentation = useCallback(async (id: string) => {
        try {
            setLoading(true);
            const { error } = await supabase.from('presentations').delete().eq('id', id);
            if (error) throw error;
            await fetchPresentations();
        } catch (error) {
            safeLog.error('Error deleting presentation:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchPresentations]);

    // Initial fetch
    useEffect(() => {
        fetchPresentations();
    }, [fetchPresentations]);

    return {
        savedPresentations: resolvedOrganizationId === organization?.id ? savedPresentations : [],
        loading: loading || Boolean(organization?.id && resolvedOrganizationId !== organization.id),
        error: resolvedOrganizationId === organization?.id ? error : null,
        fetchPresentations,
        savePresentation,
        deletePresentation
    };
}
