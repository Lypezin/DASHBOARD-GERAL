import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

export const ProfileAdminBadge: React.FC = () => {
  return (
    <div className="pt-2">
      <Badge variant="secondary" className="rounded-full border border-blue-500/20 bg-blue-50 px-3 py-1 text-blue-700 hover:bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/40">
        <Shield className="mr-1.5 h-3.5 w-3.5" />
        Conta de administrador
      </Badge>
    </div>
  );
};
