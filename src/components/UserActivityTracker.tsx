'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAppBootstrap } from '@/contexts/AppBootstrapContext';
import { safeLog } from '@/lib/errorHandler';
import { patchAppApiData, postAppApiData } from '@/utils/app/fetchAppApi';
import { scheduleIdleTask } from '@/utils/scheduling/idleTask';

const HEARTBEAT_INTERVAL_MS = 180000;

async function sendActivityUpdate(body: Record<string, unknown>) {
    const { error } = await patchAppApiData<null>('/api/app/activity-log', body, { keepalive: true });
    if (error) throw new Error(error);
}

export function UserActivityTracker() {
    const pathname = usePathname();
    const visitIdRef = useRef<string | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const { currentUser, hasResolved } = useAppBootstrap();
    const authUserId = currentUser?.id ?? null;

    useEffect(() => {
        if (pathname?.startsWith('/dashboard') || !hasResolved) {
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
                void sendActivityUpdate({
                    id: visitIdRef.current,
                    action: 'close',
                    durationSeconds: duration,
                }).catch((error) => {
                    safeLog.warn('Failed to close activity session:', error);
                });
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
                const { data, error } = await postAppApiData<{ id?: string }>('/api/app/activity-log', { path: pathname });
                const id = data?.id;

                if (id) {
                    visitIdRef.current = id;
                    heartbeatRef.current = setInterval(() => {
                        if (!visitIdRef.current || document.hidden) return;

                        void sendActivityUpdate({
                            id: visitIdRef.current,
                            action: 'heartbeat',
                        }).catch((heartbeatError) => {
                            safeLog.error('Heartbeat error:', heartbeatError);
                        });
                    }, HEARTBEAT_INTERVAL_MS);
                } else {
                    safeLog.error('Failed to start activity session:', error || 'Resposta sem id de visita.');
                    visitIdRef.current = null;
                }
            } catch (error) {
                safeLog.error('Error in UserActivityTracker:', error);
            }
        };

        const cancelRouteChange = scheduleIdleTask(
            () => {
                void handleRouteChange();
            },
            { timeoutMs: 500, fallbackDelayMs: 150 }
        );

        return () => {
            isMounted = false;
            cancelRouteChange();
            closeCurrentVisit();
        };
    }, [authUserId, hasResolved, pathname]);

    return null;
}
