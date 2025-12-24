import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';

interface RegistroSubmitButtonProps {
    loading: boolean;
}

export const RegistroSubmitButton: React.FC<RegistroSubmitButtonProps> = ({ loading }) => (
    <Button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white h-11 px-8 shadow-lg shadow-blue-500/25 border-0 transition-all active:scale-[0.98]"
    >
        {loading ? (
            <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando conta...
            </>
        ) : (
            <>
                Criar Conta
                <ArrowRight className="ml-2 h-4 w-4" />
            </>
        )}
    </Button>
);
