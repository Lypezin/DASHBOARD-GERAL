/**
 * Tipos relacionados a Autenticação e Autorização
 */

// Tipo para usuário atual com permissões
export interface CurrentUser {
  is_admin: boolean;
  assigned_pracas: string[];
  role?: 'admin' | 'marketing' | 'user';
  organization_id?: string | null;
}

// Helper para verificar se usuário tem acesso a todas as cidades
// Admin e marketing têm acesso total
export const hasFullCityAccess = (user: CurrentUser | null | undefined): boolean => {
  return user?.is_admin === true || user?.role === 'marketing';
};
