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
import { CheckCircle, X } from 'lucide-react';
import { AdminUserAccessForm } from './components/AdminUserAccessForm';

interface AdminApprovalModalProps {
  user: User;
  pracasDisponiveis: string[];
  organizations: Organization[];
  selectedPracas: string[];
  selectedRole: 'admin' | 'marketing' | 'user' | 'master';
  selectedOrganizationId: string | null;
  onPracasChange: (pracas: string[]) => void;
  onRoleChange: (role: 'admin' | 'marketing' | 'user' | 'master') => void;
  onOrganizationChange: (orgId: string | null) => void;
  onApprove: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const AdminApprovalModal: React.FC<AdminApprovalModalProps> = ({
  user,
  pracasDisponiveis,
  organizations,
  selectedPracas,
  selectedRole,
  selectedOrganizationId,
  onPracasChange,
  onRoleChange,
  onOrganizationChange,
  onApprove,
  onCancel,
  loading = false,
}) => {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-emerald-600 dark:text-emerald-500">
            <CheckCircle className="h-6 w-6" />
            Aprovar Usuário
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
            onClick={onApprove}
            disabled={loading || !selectedOrganizationId || (selectedRole !== 'marketing' && selectedPracas.length === 0)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? (
              'Aprovando...'
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Aprovar Acesso
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
