export function buildUserUpdatePayload(
    selectedRole: 'admin' | 'marketing' | 'user' | 'master',
    selectedPracas: string[],
    selectedOrganizationId: string | null
): any {
    const updateData: any = {
        assigned_pracas: selectedRole === 'marketing' ? [] : selectedPracas
    };

    if (selectedRole) {
        updateData.role = selectedRole;
        updateData.is_admin = (selectedRole === 'admin' || selectedRole === 'master');
    }

    if (selectedOrganizationId) {
        updateData.organization_id = selectedOrganizationId;
    }

    return updateData;
}
