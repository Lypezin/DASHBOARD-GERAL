import React, { useState } from 'react';
import { Organization, OrganizationOperationResult } from '@/hooks/auth/useOrganizations';
import { ModernAdminOrganizationsTable } from '@/components/admin/ModernAdminOrganizationsTable';
import { AdminOrganizationModal } from '@/components/admin/AdminOrganizationModal';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle } from 'lucide-react';

interface AdminOrganizationsTabProps {
    organizations: Organization[]; loading: boolean; error: string | null;
    createOrganization: (data: { name: string; slug: string; max_users: number }) => Promise<OrganizationOperationResult>;
    updateOrganization: (id: string, data: Partial<Organization>) => Promise<OrganizationOperationResult>;
}

export function AdminOrganizationsTab({ organizations, loading, error, createOrganization, updateOrganization }: AdminOrganizationsTabProps) {

    const [showOrgModal, setShowOrgModal] = useState(false);
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

    const handleCreateOrg = () => {
        setEditingOrg(null);
        setShowOrgModal(true);
    };

    const handleEditOrg = (org: Organization) => {
        setEditingOrg(org);
        setShowOrgModal(true);
    };

    const handleSaveOrg = async (formData: { name: string; slug: string; max_users: number }) => {
        if (editingOrg) {
            const result = await updateOrganization(editingOrg.id, formData);
            if (result.success) {
                setShowOrgModal(false);
                setEditingOrg(null);
            }
            return result;
        } else {
            const result = await createOrganization(formData);
            if (result.success) {
                setShowOrgModal(false);
            }
            return result;
        }
    };

    const handleToggleOrgActive = async (org: Organization) => {
        await updateOrganization(org.id, { is_active: !org.is_active });
    };

    return (
        <div className="space-y-6 animate-in fade-in-50 duration-500">
            {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <h3 className="font-medium">Erro ao Carregar Organizações</h3>
                    </div>
                    <p className="mt-1 text-sm">{error}</p>
                </div>
            )}

            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold tracking-tight">
                    Organizações ({organizations.length})
                </h2>
                <Button onClick={handleCreateOrg}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Organização
                </Button>
            </div>

            {loading ? (
                <div className="rounded-md border p-8 text-center text-muted-foreground">
                    Carregando organizações...
                </div>
            ) : (
                <ModernAdminOrganizationsTable
                    organizations={organizations}
                    onEdit={handleEditOrg}
                    onToggleActive={handleToggleOrgActive}
                />
            )}

            {showOrgModal && (
                <AdminOrganizationModal
                    organization={editingOrg}
                    isOpen={showOrgModal}
                    onClose={() => {
                        setShowOrgModal(false);
                        setEditingOrg(null);
                    }}
                    onSave={handleSaveOrg}
                />
            )}
        </div>
    );
}
