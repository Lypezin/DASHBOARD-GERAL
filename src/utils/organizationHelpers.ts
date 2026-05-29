
/**
 * Helpers para gerenciar organization_id no Supabase Auth.
 * Mantido como facade de compatibilidade para imports legados.
 */
import {
  getCurrentUserOrganizationId,
  syncOrganizationIdToMetadata,
} from '@/services/userOrganizationService';

export { getCurrentUserOrganizationId, syncOrganizationIdToMetadata };
