'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const HEARTBEAT_INTERVAL_MS = 60000;

export function UserActivityTracker() {
    const pathname = usePathname();
    const visitIdRef = useRef<string | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [authUserId, setAuthUserId] = useState<string | null | undefined>(undefined);

    useEffect(() => {
        let mounted = true;

        const syncAuthUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (mounted) {
                setAuthUserId(session?.user?.id ?? null);
            }
        };

        void syncAuthUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!mounted) return;
            setAuthUserId(session?.user?.id ?? null);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (pathname?.startsWith('/dashboard') || authUserId === undefined) {
            return;
        }

        let isMounted = true;

        const closeCurrentVisit = () => {
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

            visitIdRef.current = null;
            startTimeRef.current = null;
        };

        const handleRouteChange = async () => {
            const now = Date.now();
            if (!authUserId || !isMounted) return;

            closeCurrentVisit();
            startTimeRef.current = now;

            try {
                const { data, error } = await supabase
                    .from('user_activity_logs')
                    .insert({
                        user_id: authUserId,
                        path: pathname,
                        entered_at: new Date().toISOString(),
                        last_seen: new Date().toISOString()
                    })
                    .select('id')
                    .single();

                if (data && !error) {
                    visitIdRef.current = data.id;
                    heartbeatRef.current = setInterval(() => {
                        if (!visitIdRef.current || document.hidden) return;

                        supabase
                            .from('user_activity_logs')
                            .update({ last_seen: new Date().toISOString() })
                            .eq('id', visitIdRef.current)
                            .then(({ error: heartbeatError }) => {
                                if (heartbeatError) console.error('Heartbeat error:', heartbeatError);
                            });
                    }, HEARTBEAT_INTERVAL_MS);
                } else {
                    console.error('Failed to start activity session:', error);
                    visitIdRef.current = null;
                }
            } catch (error) {
                console.error('Error in UserActivityTracker:', error);
            }
        };

        let idleId: number | null = null;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
            idleId = window.requestIdleCallback(() => {
                void handleRouteChange();
            }, { timeout: 500 });
        } else {
            timeoutId = setTimeout(() => {
                void handleRouteChange();
            }, 150);
        }

        return () => {
            isMounted = false;

            if (idleId !== null && typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function') {
                window.cancelIdleCallback(idleId);
            }

            if (timeoutId !== null) {
                clearTimeout(timeoutId);
            }

            closeCurrentVisit();
        };
    }, [authUserId, pathname]);

    return null;
}
