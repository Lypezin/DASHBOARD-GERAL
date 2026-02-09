'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export function UserActivityTracker() {
    const pathname = usePathname();
    const visitIdRef = useRef<string | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const handleRouteChange = async () => {
            const now = Date.now();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;

            // Close previous visit if exists
            if (visitIdRef.current && startTimeRef.current) {
                // Clear previous heartbeat
                if (heartbeatRef.current) {
                    clearInterval(heartbeatRef.current);
                    heartbeatRef.current = null;
                }

                const duration = Math.round((now - startTimeRef.current) / 1000);

                // Fire and forget update
                supabase
                    .from('user_activity_logs')
                    .update({
                        exited_at: new Date().toISOString(),
                        duration_seconds: duration,
                        last_seen: new Date().toISOString()
                    })
                    .eq('id', visitIdRef.current)
                    .then(); // ignore result
            }

            // Start new visit
            startTimeRef.current = now;
            try {
                // Try to include last_seen if the column exists (it should after SQL run)
                // If it fails, we fall back? No, this is fire and forget mostly.
                const { data, error } = await supabase
                    .from('user_activity_logs')
                    .insert({
                        user_id: user.id,
                        path: pathname,
                        entered_at: new Date().toISOString(),
                        last_seen: new Date().toISOString()
                    })
                    .select('id')
                    .single();

                if (data && !error) {
                    visitIdRef.current = data.id;

                    // Start Heartbeat
                    heartbeatRef.current = setInterval(() => {
                        if (visitIdRef.current) {
                            supabase
                                .from('user_activity_logs')
                                .update({ last_seen: new Date().toISOString() })
                                .eq('id', visitIdRef.current)
                                .then(({ error }) => {
                                    if (error) console.error('Heartbeat error:', error);
                                });
                        }
                    }, 30000); // 30 seconds

                } else {
                    console.error('Failed to start activity session:', error);
                    visitIdRef.current = null;
                }
            } catch (e) {
                console.error('Error in UserActivityTracker:', e);
            }
        };

        handleRouteChange();

        // Cleanup on unmount (only when component functionality completely stops, e.g. app close?)
        // In Next.js App Router, layout doesn't unmount on page change, so this is fine.
        return () => {
            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current);
                heartbeatRef.current = null;
            }
            if (visitIdRef.current && startTimeRef.current) {
                const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
                supabase
                    .from('user_activity_logs')
                    .update({
                        exited_at: new Date().toISOString(),
                        duration_seconds: duration,
                        last_seen: new Date().toISOString()
                    })
                    .eq('id', visitIdRef.current)
                    .then();
            }
        };
    }, [pathname]);

    return null;
}
