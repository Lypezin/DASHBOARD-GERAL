/**
 * Helpers para gerenciar organization_id no Supabase Auth
 */
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Sincroniza organization_id do user_profiles para user_metadata do Supabase Auth
 * Esta função deve ser chamada após login ou quando organization_id é atualizado
 */
export async function syncOrganizationIdToMetadata(): Promise<boolean> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      if (IS_DEV) {
        safeLog.warn('[syncOrganizationIdToMetadata] Usuário não autenticado');
      }
      return false;
    }

    // Buscar organization_id do perfil
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      if (IS_DEV) {
        safeLog.warn('[syncOrganizationIdToMetadata] Erro ao buscar perfil:', profileError);
      }
      return false;
    }

    const organizationId = profile.organization_id;

    // Verificar se já está sincronizado
    const currentOrgId = user.user_metadata?.organization_id;
    if (currentOrgId === organizationId) {
      return true; // Já está sincronizado
    }

    // Atualizar user_metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        organization_id: organizationId,
      },
    });

    if (updateError) {
      if (IS_DEV) {
        safeLog.error('[syncOrganizationIdToMetadata] Erro ao atualizar user_metadata:', updateError);
      }
      return false;
    }

    if (IS_DEV) {
      safeLog.info('[syncOrganizationIdToMetadata] organization_id sincronizado com sucesso');
    }

    return true;
  } catch (err) {
    if (IS_DEV) {
      safeLog.error('[syncOrganizationIdToMetadata] Erro inesperado:', err);
    }
    return false;
  }
}

