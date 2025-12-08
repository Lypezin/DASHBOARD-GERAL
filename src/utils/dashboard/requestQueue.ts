import { RATE_LIMIT } from '@/constants/config';

interface QueueEntry {
    timestamp: number;
    count: number;
}

export const requestQueue = new Map<string, QueueEntry>();
export const pendingRequests = new Map<string, Promise<unknown>>();

export function checkRateLimit(key: string): boolean {
    const entry = requestQueue.get(key);
    const now = Date.now();
    if (entry && (now - entry.timestamp) < RATE_LIMIT.MIN_REQUEST_INTERVAL) {
        return false;
    }
    return true;
}

export function addToQueue(key: string) {
    const entry = requestQueue.get(key);
    const now = Date.now();
    requestQueue.set(key, { timestamp: now, count: (entry?.count || 0) + 1 });

    // Cleanup
    let cleanedCount = 0;
    for (const [k, e] of requestQueue.entries()) {
        if (cleanedCount >= RATE_LIMIT.MAX_CLEANUP_ENTRIES) break;
        if (now - e.timestamp > RATE_LIMIT.QUEUE_CLEANUP_INTERVAL) {
            requestQueue.delete(k);
            cleanedCount++;
        }
    }
}

export function getPendingRequest(key: string) {
    return pendingRequests.get(key);
}

export function setPendingRequest(key: string, promise: Promise<unknown>) {
    pendingRequests.set(key, promise);
    promise.finally(() => pendingRequests.delete(key));
}
