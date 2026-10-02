import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export const AdminHeader = React.memo(function AdminHeader() {
    return (
        <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-end">
            <div>
                <div className="mb-1 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                        Painel Administrativo
                    </h1>
                </div>
                <p className="pl-7 text-sm text-muted-foreground">
                    Gerenciamento de usuários, permissões e organizações.
                </p>
            </div>

            <div className="flex items-center gap-3">
                <Link href="/">
                    <Button variant="outline" className="border-border bg-card text-foreground hover:bg-muted">
                        Voltar ao Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    );
});
