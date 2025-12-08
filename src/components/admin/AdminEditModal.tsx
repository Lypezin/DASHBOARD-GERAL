import React from 'react';
import { User } from '@/hooks/useAdminData';
import { Organization } from '@/hooks/useOrganizations';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit, Save, X } from 'lucide-react';
import { AdminUserAccessForm } from './components/AdminUserAccessForm';

interface AdminEditModalProps {
  user: User;
  pracasDisponiveis: string[];
  organizations: Organization[];
  selectedPracas: string[];
  selectedRole: 'admin' | 'marketing' | 'user' | 'master';
  selectedOrganizationId: string | null;
  onPracasChange: (pracas: string[]) => void;
  onRoleChange: (role: 'admin' | 'marketing' | 'user' | 'master') => void;
  onOrganizationChange: (orgId: string | null) => void;
  onSave: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const AdminEditModal: React.FC<AdminEditModalProps> = ({
  user,
  pracasDisponiveis,
  organizations,
  selectedPracas,
  selectedRole,
  selectedOrganizationId,
  onPracasChange,
  onRoleChange,
  onOrganizationChange,
  onSave,
  onCancel,
  loading = false,
}) => {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Edit className="h-5 w-5 text-primary" />
            Editar Praças
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{user.full_name}</p>
            <p>{user.email}</p>
          </div>
        </DialogHeader>

        <AdminUserAccessForm
          pracasDisponiveis={pracasDisponiveis}
          organizations={organizations}
          selectedPracas={selectedPracas}
          selectedRole={selectedRole}
          selectedOrganizationId={selectedOrganizationId}
          onPracasChange={onPracasChange}
          onRoleChange={onRoleChange}
          onOrganizationChange={onOrganizationChange}
        />

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            disabled={loading || !selectedOrganizationId || (selectedRole !== 'marketing' && selectedPracas.length === 0)}
          >
            {loading ? (
              'Salvando...'
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
