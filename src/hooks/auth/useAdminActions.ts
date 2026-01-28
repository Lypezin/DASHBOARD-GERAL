import { UserProfile } from './useAdminData';
import { useAdminApproval } from '@/hooks/admin/useAdminApproval';
import { useAdminEdit } from '@/hooks/admin/useAdminEdit';
import { useAdminStatus } from '@/hooks/admin/useAdminStatus';

export function useAdminActions(
  currentUser: UserProfile | null,
  fetchData: () => void
) {
  const { approvalState, approvalActions } = useAdminApproval(currentUser, fetchData);
  const { editState, editActions } = useAdminEdit(fetchData);
  const { handleRevokeAccess, handleToggleAdmin } = useAdminStatus(fetchData);

  // Mapeamento para interface original para manter compatibilidade
  // Onde há conflito de estado (ex: selectedPracas nos dois modais), priorizamos o modal ativo
  // ou expomos ambos se necessário. Aqui vamos simplificar expondo o estado do modal ativo ou null.

  // Nota: Na implementação original, apenas um conjunto de selectedPracas existia.
  // Agora temos dois isolados. Para componentes que dependem de "selectedPracas",
  // precisamos saber qual contexto estão consumindo.
  // Felizmente, React re-renderiza quando qualquer mudança ocorre.

  // Vamos expor as funções e estados combinados
  return {
    // Estados do Modal de Aprovação
    selectedUser: approvalState.selectedUser,
    showModal: approvalState.showModal,

    // Estados do Modal de Edição
    editingUser: editState.editingUser,
    showEditModal: editState.showEditModal,

    // Estados Mutáveis (Proxy para o estado do modal que estiver aberto)
    // Isso é um pouco arriscado se ambos estiverem abertos, mas a UI não deve permitir isso.
    selectedPracas: approvalState.showModal ? approvalState.selectedPracas : editState.selectedPracas,
    selectedRole: approvalState.showModal ? approvalState.selectedRole : editState.selectedRole,
    selectedOrganizationId: approvalState.showModal ? approvalState.selectedOrganizationId : editState.selectedOrganizationId,

    // Setters (Proxy inteligente)
    setSelectedPracas: (value: string[] | ((val: string[]) => string[])) => {
      if (approvalState.showModal) approvalActions.setSelectedPracas(value as any);
      if (editState.showEditModal) editActions.setSelectedPracas(value as any);
    },
    setSelectedRole: (value: any) => {
      if (approvalState.showModal) approvalActions.setSelectedRole(value);
      if (editState.showEditModal) editActions.setSelectedRole(value);
    },
    setSelectedOrganizationId: (value: any) => {
      if (approvalState.showModal) approvalActions.setSelectedOrganizationId(value);
      if (editState.showEditModal) editActions.setSelectedOrganizationId(value);
    },

    // Actions
    handleApproveUser: approvalActions.startApproval,
    handleSaveApproval: approvalActions.saveApproval,
    handleCancelApproval: approvalActions.cancelApproval,

    handleEditPracas: editActions.startEdit,
    handleSaveEditPracas: editActions.saveEdit,
    handleCancelEdit: editActions.cancelEdit,

    handleRevokeAccess,
    handleToggleAdmin,
  };
}
