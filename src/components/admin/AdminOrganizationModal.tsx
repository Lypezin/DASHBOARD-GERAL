'use client';

import React, { useState, useEffect } from 'react';
import { Organization, OrganizationFormData } from '@/hooks/useOrganizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
        {/* Header do Modal */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <span>{isEditing ? '✏️' : '➕'}</span>
            {isEditing ? 'Editar Organização' : 'Nova Organização'}
          </h3>
          <p className="mt-2 text-sm text-indigo-100">
            {isEditing
              ? 'Atualize as informações da organização'
              : 'Crie uma nova organização para um cliente'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Organização *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }));
                  // Sempre gerar slug quando o nome mudar (tanto criando quanto editando)
                  handleSlugChange(e.target.value);
                }}
                placeholder="Ex: Empresa XYZ"
                disabled={saving || isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                placeholder="empresa-xyz"
                disabled={saving || isLoading}
                required
                pattern="[a-z0-9-]+"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Identificador único (apenas letras minúsculas, números e hífens)
                {isEditing && (
                  <span className="block mt-1 text-amber-500 dark:text-amber-400">
                    💡 O slug é atualizado automaticamente quando você muda o nome. Você pode editá-lo manualmente se necessário.
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_users">Limite de Usuários *</Label>
              <Input
                id="max_users"
                type="number"
                min="1"
                max="1000"
                value={formData.max_users}
                onChange={(e) => setFormData(prev => ({ ...prev, max_users: parseInt(e.target.value) || 10 }))}
                disabled={saving || isLoading}
                required
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Número máximo de colaboradores permitidos nesta organização
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 p-3">
                <p className="text-sm text-rose-800 dark:text-rose-200">{error}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving || isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || isLoading}
            >
              {saving ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

