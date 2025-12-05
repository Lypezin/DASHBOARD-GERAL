'use client';

import React, { useState, useEffect } from 'react';
import { Organization, OrganizationFormData } from '@/hooks/useOrganizations';
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
  const [formData, setFormData] = useState<OrganizationFormData>({
    name: '',
    slug: '',
    max_users: 10,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEditing = !!organization;

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name,
        slug: organization.slug,
        max_users: organization.max_users,
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        max_users: 10,
      });
    }
    setError(null);
  }, [organization, isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSaving(true);

    // Validação
    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      setSaving(false);
      return;
    }

    if (!formData.slug.trim()) {
      setError('Slug é obrigatório');
      setSaving(false);
      return;
    }

    // Validar formato do slug
    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      setError('Slug deve conter apenas letras minúsculas, números e hífens');
      setSaving(false);
      return;
    }

    if (formData.max_users < 1 || formData.max_users > 1000) {
      setError('Limite de usuários deve estar entre 1 e 1000');
      setSaving(false);
      return;
    }

    const result = await onSave(formData);

    if (result.success) {
      onClose();
      setFormData({ name: '', slug: '', max_users: 10 });
    } else {
      setError(result.error || 'Erro ao salvar organização');
    }

    setSaving(false);
  };

  const handleSlugChange = (value: string) => {
    // Auto-gerar slug a partir do nome
    const slug = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setFormData(prev => ({
      ...prev,
      slug: slug, // Sempre usar o slug gerado
    }));
  };

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
