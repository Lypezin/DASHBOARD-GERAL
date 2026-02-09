import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Shield } from 'lucide-react';

export const ProfileAdminBadge: React.FC = () => {
    return (
        <div className="pt-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-none px-3 py-1">
                <Shield className="w-3 h-3 mr-1.5" />
                Conta de Administrador
            </Badge>
        </div>
    );
};
