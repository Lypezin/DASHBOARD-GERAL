'use client';

import React from 'react';
import { Organization, OrganizationFormData } from '@/hooks/auth/useOrganizations';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Building2, Plus } from 'lucide-react';
import { AdminOrganizationForm } from './AdminOrganizationForm';
import { useOrganizationForm } from './hooks/useOrganizationForm';

interface AdminOrganizationModalProps {
  organization: Organization | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: OrganizationFormData) => Promise<{ success: boolean; error?: string }>;
  isLoading?: boolean;
}

export const AdminOrganizationModal: React.FC<AdminOrganizationModalProps> = ({
  organization,
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const {
    formData,
    setFormData,
    error,
    saving,
    handleSubmit,
    handleSlugChange
  } = useOrganizationForm({
    organization,
    onSave,
    onSuccess: onClose
  });

  const isEditing = !!organization;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {isEditing ? <Building2 className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
            {isEditing ? 'Editar Organização' : 'Nova Organização'}
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            {isEditing
              ? 'Atualize as informações da organização'
              : 'Crie uma nova organização para um cliente'}
          </div>
        </DialogHeader>

        <AdminOrganizationForm
          formData={formData}
          setFormData={setFormData}
          handleSlugChange={handleSlugChange}
          disabled={saving || isLoading}
          error={error}
        />

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving || isLoading}>
            Cancelar
          </Button>
          <Button onClick={() => handleSubmit()} disabled={saving || isLoading}>
            {saving ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
