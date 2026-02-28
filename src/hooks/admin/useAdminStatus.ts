import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { executeAdminRpc } from '@/utils/adminHelpers';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useAdminStatus(fetchData: () => void) {

    const handleRevokeAccess = async (userId: string) => {
        if (!confirm('Tem certeza que deseja revogar o acesso deste usuário?')) return;

        try {
            const { error } = await executeAdminRpc(
                'revoke_user_access',
                { user_id: userId },
                async () => supabase
                    .from('user_profiles')
                    .update({ is_approved: false, status: 'pending', role: 'user', assigned_pracas: [] })
                    .eq('id', userId)
            );

            if (error) throw error;
            fetchData();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Erro desconhecido';
            alert('Erro ao revogar acesso: ' + msg);
        }
    };

    const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
        const action = currentIsAdmin ? 'remover admin de' : 'tornar admin';
        if (!confirm(`Tem certeza que deseja ${action} este usuário?`)) return;

        try {
            const { data, error } = await executeAdminRpc(
                'set_user_admin',
                { user_id: userId, make_admin: !currentIsAdmin }
            );

            if (error) {
                if (IS_DEV) {
                    safeLog.error('Erro detalhado ao alterar admin:', {
                        error, userId, make_admin: !currentIsAdmin,
                        errorCode: (error as any)?.code, errorMessage: (error as any)?.message,
                        errorDetails: (error as any)?.details, errorHint: (error as any)?.hint
                    });
                }

                const errorObj = error as any;
                const errorMessage = String(errorObj?.message || errorObj?.details || errorObj?.hint || '');
                const errorCode = errorObj?.code || '';

                const is404 = errorCode === 'PGRST116' ||
                    errorCode === '42883' ||
                    errorMessage.includes('404') ||
                    errorMessage.includes('not found') ||
                    errorMessage.includes('function') && errorMessage.includes('does not exist');

                if (is404) {
                    alert('Função não encontrada. Isso pode ser um problema temporário de cache. Aguarde alguns segundos e tente novamente. Se o problema persistir, recarregue a página.');
                    return;
                }

                let userMessage = 'Erro ao alterar status de admin: ';
                if (errorCode === '42501' || errorMessage.includes('permission denied')) {
                    userMessage += 'Você não tem permissão para realizar esta ação.';
                } else if (errorCode === '23505' || errorMessage.includes('unique constraint')) {
                    userMessage += 'Este usuário já possui este status.';
                } else if (errorMessage) {
                    userMessage += errorMessage;
                } else {
                    userMessage += 'Ocorreu um erro. Tente novamente mais tarde.';
                }

                alert(userMessage);
                return;
            }

            if (IS_DEV) {
                safeLog.info('Status de admin alterado com sucesso:', { userId, make_admin: !currentIsAdmin, data });
            }
            fetchData();
        } catch (err: unknown) {
            if (IS_DEV) {
                safeLog.error('Erro inesperado ao alterar admin:', err);
            }
            const errorMessage = err instanceof Error ? err.message : (typeof err === 'object' && err !== null ? String(err) : 'Ocorreu um erro. Tente novamente mais tarde.');
            alert('Erro ao alterar status de admin: ' + errorMessage);
        }
    };

    return {
        handleRevokeAccess,
        handleToggleAdmin
    };
}
