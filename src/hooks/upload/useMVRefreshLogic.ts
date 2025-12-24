
import { useCallback, useState } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { isLowUsageTime, getTimeContextMessage } from '@/utils/timeHelpers';
import { performRefresh } from './refreshUtils';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useMVRefreshLogic() {
    const [refreshState, setRefreshState] = useState({
        isRefreshing: false,
        progress: 0,
        status: ''
    });

    const triggerRefresh = useCallback(async (force = false) => {
        try {
            const isLowUsage = isLowUsageTime();
            const timeContext = getTimeContextMessage();

            if (!isLowUsage && !force && IS_DEV) {
                safeLog.info(`⏰ ${timeContext} - Refresh automático será adiado para horário de baixo uso`);
                safeLog.info('💡 Dica: Use o botão "Atualizar Materialized Views" para forçar refresh imediato');
                return;
            }

            setRefreshState({ isRefreshing: true, progress: 5, status: 'Iniciando atualização de dados...' });

            setTimeout(() => {
                performRefresh(force, isLowUsage, timeContext, setRefreshState);
            }, 2000);
        } catch (e) {
            if (IS_DEV) {
                safeLog.warn('Erro ao iniciar refresh de MVs');
            }
            setRefreshState({ isRefreshing: false, progress: 0, status: 'Erro' });
        }
    }, []);

    return {
        refreshState,
        triggerRefresh
    };
}
