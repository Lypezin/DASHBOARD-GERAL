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
        className="h-11 w-full border-0 bg-[#0754d8] px-8 text-white shadow-sm transition-colors hover:bg-[#0647b7] active:scale-[0.98]"
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
