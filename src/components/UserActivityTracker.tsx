'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAppBootstrap } from '@/contexts/AppBootstrapContext';
import { safeLog } from '@/lib/errorHandler';
import { buildAppAuthHeaders } from '@/utils/app/appAuthHeaders';

const HEARTBEAT_INTERVAL_MS = 180000;

async function sendActivityUpdate(body: Record<string, unknown>) {
    const response = await fetch('/api/app/activity-log', {
        method: 'PATCH',
        headers: await buildAppAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'same-origin',
        cache: 'no-store',
        keepalive: true,
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || `Erro HTTP ${response.status}`);
    }
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
                const response = await fetch('/api/app/activity-log', {
                    method: 'POST',
                    headers: await buildAppAuthHeaders({ 'Content-Type': 'application/json' }),
                    credentials: 'same-origin',
                    cache: 'no-store',
                    body: JSON.stringify({ path: pathname }),
                });

                const payload = await response.json().catch(() => null) as {
                    data?: { id?: string } | null;
                    error?: string | null;
                } | null;
                const id = payload?.data?.id;

                if (response.ok && id) {
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
                    safeLog.error('Failed to start activity session:', payload?.error || response.statusText);
                    visitIdRef.current = null;
                }
            } catch (error) {
                safeLog.error('Error in UserActivityTracker:', error);
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
    }, [authUserId, hasResolved, pathname]);

    return null;
}
