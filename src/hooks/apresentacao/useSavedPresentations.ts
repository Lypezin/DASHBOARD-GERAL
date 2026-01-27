import { useState, useCallback, useEffect } from 'react';
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

    const fetchPresentations = useCallback(async () => {
        if (!organization?.id) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('presentations')
                .select('*')
                .eq('organization_id', organization.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSavedPresentations(data || []);
        } catch (error) {
            safeLog.error('Error fetching presentations:', error);
        } finally {
            setLoading(false);
        }
    }, [organization?.id]);

    const savePresentation = useCallback(async (
        name: string,
        slides: MediaSlideData[],
        sections: Record<string, boolean>,
        filters: any
    ) => {
        if (!organization?.id) return null;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('presentations')
                .insert({
                    organization_id: organization.id,
                    name,
                    slides,
                    sections,
                    filters
                })
                .select()
                .single();

            if (error) throw error;

            await fetchPresentations(); // Refresh list
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
            const { error } = await supabase
                .from('presentations')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await fetchPresentations(); // Refresh list
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
        savedPresentations,
        loading,
        fetchPresentations,
        savePresentation,
        deletePresentation
    };
}
