'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export function UserActivityTracker() {
    const pathname = usePathname();
    const visitIdRef = useRef<string | null>(null);
    const startTimeRef = useRef<number | null>(null);

    useEffect(() => {
        const handleRouteChange = async () => {
            const now = Date.now();
            const currentUser = (await supabase.auth.getUser()).data.user;

            if (!currentUser) return;

            // Close previous visit if exists
            if (visitIdRef.current && startTimeRef.current) {
                const duration = Math.round((now - startTimeRef.current) / 1000);

                // Fire and forget update
                supabase
                    .from('user_activity_logs')
                    .update({
                        exited_at: new Date().toISOString(),
                        duration_seconds: duration
                    })
                    .eq('id', visitIdRef.current)
                    .then(); // ignore result
            }

            // Start new visit
            startTimeRef.current = now;
            try {
                const { data, error } = await supabase
                    .from('user_activity_logs')
                    .insert({
                        user_id: currentUser.id,
                        path: pathname,
                        entered_at: new Date().toISOString()
                    })
                    .select('id')
                    .single();

                if (data && !error) {
                    visitIdRef.current = data.id;
                } else {
                    // silently fail if table doesn't exist
                    visitIdRef.current = null;
                }
            } catch (e) {
                // silently fail
            }
        };

        handleRouteChange();

        // Cleanup on unmount (only when component functionality completely stops, e.g. app close?)
        // In Next.js App Router, layout doesn't unmount on page change, so this is fine.
        return () => {
            if (visitIdRef.current && startTimeRef.current) {
                const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
                supabase
                    .from('user_activity_logs')
                    .update({
                        exited_at: new Date().toISOString(),
                        duration_seconds: duration
                    })
                    .eq('id', visitIdRef.current)
                    .then();
            }
        };
    }, [pathname]);

    return null;
}
