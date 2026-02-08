import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export const AdminHeader: React.FC = () => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">

            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div>
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg text-white shadow-lg shadow-blue-500/20">
                        <Shield className="w-5 h-5" />
                    </div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">
                        Painel Administrativo
                    </h1>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium pl-1">
                    Gerenciamento de usuários, permissões e organizações.
                </p>
            </div>

            <div className="flex items-center gap-3">
                <Link href="/">
                    <Button variant="outline" className="backdrop-blur-sm bg-white/50 dark:bg-slate-900/50">
                        Voltar ao Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    );
};
