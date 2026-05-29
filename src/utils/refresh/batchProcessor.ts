import { PendingMV } from '@/types/upload';
import { mvService } from '@/services/mvService';
import { safeLog } from '@/lib/errorHandler';

export interface BatchProgress {
    current: number;
    total: number;
    currentMv: string;
    completed: number;
    failed: string[];
}

export type ProgressCallback = (progress: BatchProgress) => void;

export async function processMVBatch(
    mvs: PendingMV[],
    onProgress: ProgressCallback
): Promise<{ successCount: number; failCount: number; failedViews: string[] }> {
    const totalMVs = mvs.length;
    let successCount = 0;
    let failCount = 0;
    const failedViews: string[] = [];

    for (let i = 0; i < totalMVs; i++) {
        const mv = mvs[i];
        const currentIndex = i + 1;

        onProgress({
            current: currentIndex,
            total: totalMVs,
            currentMv: mv.mv_name,
            completed: i,
            failed: failedViews
        });

        try {
            const { data: refreshData, error: refreshError } = await mvService.refreshSingleMV(mv.mv_name);
            const result = mvService.processRefreshResult(refreshData, refreshError, mv.mv_name);

            if (result.success) {
                successCount++;
            } else if (!result.isTimeout) {
                failCount++;
                failedViews.push(mv.mv_name);
            }
        } catch (error) {
            failCount++;
            failedViews.push(mv.mv_name);
            safeLog.error(`Erro ao atualizar ${mv.mv_name}: `, error);
        }

        onProgress({
            current: currentIndex,
            total: totalMVs,
            currentMv: mv.mv_name,
            completed: currentIndex,
            failed: failedViews
        });

        if (i < totalMVs - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    return { successCount, failCount, failedViews };
}
