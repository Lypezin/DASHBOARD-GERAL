
import { useCallback, useState } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { isLowUsageTime, getTimeContextMessage } from '@/utils/timeHelpers';
import { performRefresh } from './refreshUtils';

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

            safeLog.info(`[MV Refresh] Disparado - force=${force}, isLowUsage=${isLowUsage}, timeContext=${timeContext}`);

            if (!isLowUsage && !force) {
                safeLog.info('[MV Refresh] Adiado - não é horário de baixo uso e não foi forçado');
                return;
            }

            setRefreshState({ isRefreshing: true, progress: 5, status: 'Iniciando atualização de dados...' });

            safeLog.info('[MV Refresh] Iniciando performRefresh...');

            // Executar diretamente sem setTimeout para garantir execução imediata
            await performRefresh(force, isLowUsage, timeContext, setRefreshState);

            safeLog.info('[MV Refresh] performRefresh concluído');
        } catch (e) {
            safeLog.error('[MV Refresh] Erro ao iniciar refresh de MVs:', e);
            setRefreshState({ isRefreshing: false, progress: 0, status: 'Erro ao atualizar MVs' });
        }
    }, []);

    return {
        refreshState,
        triggerRefresh
    };
}
