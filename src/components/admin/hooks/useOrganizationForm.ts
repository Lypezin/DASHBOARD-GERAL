import { useState, useCallback, useEffect } from 'react';
import { Organization, OrganizationFormData, useOrganizations } from '@/hooks/auth/useOrganizations';

interface UseOrganizationFormProps {
    organization: Organization | null;
    onSave: (data: OrganizationFormData) => Promise<{ success: boolean; error?: string }>;
    onSuccess: () => void;
}

export function useOrganizationForm({ organization, onSave, onSuccess }: UseOrganizationFormProps) {
    const [formData, setFormData] = useState<OrganizationFormData>({
        name: '',
        slug: '',
        max_users: 10,
    });
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

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
    }, [organization]);

    const handleSlugChange = useCallback((value: string) => {
        const slug = value
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        setFormData(prev => ({
            ...prev,
            slug: slug,
        }));
    }, []);

    const validateForm = () => {
        if (!formData.name.trim()) return 'Nome é obrigatório';
        if (!formData.slug.trim()) return 'Slug é obrigatório';
        if (!/^[a-z0-9-]+$/.test(formData.slug)) return 'Slug deve conter apenas letras minúsculas, números e hífens';
        if (formData.max_users < 1 || formData.max_users > 1000) return 'Limite de usuários deve estar entre 1 e 1000';
        return null;
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError(null);
        setSaving(true);

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            setSaving(false);
            return;
        }

        const result = await onSave(formData);

        if (result.success) {
            onSuccess();
            setFormData({ name: '', slug: '', max_users: 10 });
        } else {
            setError(result.error || 'Erro ao salvar organização');
        }

        setSaving(false);
    };

    return {
        formData,
        setFormData,
        error,
        saving,
        handleSubmit,
        handleSlugChange
    };
}
