import { safeLog } from '@/lib/errorHandler';
import { DashboardFilters } from '@/types/filters';
import { postAppApiData } from '@/utils/app/fetchAppApi';
import { IS_DEV } from '@/constants/environment';


const functionAvailability = {
    status: null as boolean | null,
    lastCheck: 0 as number,
    checkInterval: 60000
};

export async function logActivityToRpc(
    sessionId: string,
    action_type: string,
    description: string,
    tab_name: string | null,
    filters_applied: DashboardFilters | Record<string, unknown>
) {
    if (!sessionId || sessionId.trim() === '') return;

    // Check availability
    if (functionAvailability.status === false) {
        if (Date.now() - functionAvailability.lastCheck < functionAvailability.checkInterval) return;
        functionAvailability.status = null;
    }

    const { error } = await postAppApiData<null>('/api/app/activity', {
        sessionId,
        actionType: action_type,
        description: description || null,
        tabName: tab_name || null,
        filtersApplied: filters_applied && Object.keys(filters_applied).length > 0 ? filters_applied : null
    });

    if (error) {
        const msg = String(error || '');
        const is404 = msg.includes('404') || msg.includes('not found');

        if (is404) {
            functionAvailability.status = false;
            functionAvailability.lastCheck = Date.now();
            return;
        }

        if (functionAvailability.status === null) functionAvailability.status = true;

        if (action_type !== 'heartbeat' && IS_DEV) {
            safeLog.warn('Erro ao registrar atividade:', { error, action_type });
        }
    } else {
        if (functionAvailability.status === null) functionAvailability.status = true;
        functionAvailability.lastCheck = Date.now();
    }
}
