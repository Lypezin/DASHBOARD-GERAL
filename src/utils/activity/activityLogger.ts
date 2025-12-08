import { safeRpc } from '@/lib/rpcWrapper';
import { safeLog } from '@/lib/errorHandler';
import { DashboardFilters } from '@/types/filters';

const IS_DEV = process.env.NODE_ENV === 'development';

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

    const { error } = await safeRpc('registrar_atividade', {
        p_session_id: sessionId,
        p_action_type: action_type,
        p_action_details: description || null,
        p_tab_name: tab_name || null,
        p_filters_applied: filters_applied && Object.keys(filters_applied).length > 0 ? filters_applied : null
    }, { timeout: 10000, validateParams: false });

    if (error) {
        const msg = String(error?.message || '');
        const is404 = error?.code === 'PGRST116' || msg.includes('404') || msg.includes('not found');

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
