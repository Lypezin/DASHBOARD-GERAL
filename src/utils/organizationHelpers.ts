/**
 * Helpers para gerenciar organization_id no Supabase Auth
 */
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';

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

/**
 * Obtém o organization_id do usuário atual
 * Tenta obter do user_metadata primeiro, depois do perfil
 * Se for admin/master sem organization_id, retorna organização padrão
 */
export async function getCurrentUserOrganizationId(): Promise<string | null> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      if (IS_DEV) {
        safeLog.warn('[getCurrentUserOrganizationId] Usuário não autenticado');
      }
      return null;
    }

    // Tentar obter do user_metadata primeiro
    const orgIdFromMetadata = user.user_metadata?.organization_id as string | undefined;
    if (orgIdFromMetadata) {
      return orgIdFromMetadata;
    }

    // Se não tiver no metadata, buscar do perfil
    const { data: profile, error: profileError } = await safeRpc<{
      organization_id?: string | null;
      is_admin?: boolean;
      role?: string;
    }>('get_current_user_profile', {}, {
      timeout: 5000,
      validateParams: false
    });

    if (profileError || !profile) {
      if (IS_DEV) {
        safeLog.warn('[getCurrentUserOrganizationId] Erro ao buscar perfil:', profileError);
      }
      return null;
    }

    const orgId = profile.organization_id;

    // Se for admin ou master sem organization_id, usar organização padrão
    if (!orgId && (profile.is_admin || profile.role === 'master')) {
      if (IS_DEV) {
        safeLog.warn('[getCurrentUserOrganizationId] Admin/Master sem organization_id, usando padrão');
      }
      return '00000000-0000-0000-0000-000000000001';
    }

    return orgId || null;
  } catch (err) {
    if (IS_DEV) {
      safeLog.error('[getCurrentUserOrganizationId] Erro inesperado:', err);
    }
    return null;
  }
}

