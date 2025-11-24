import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    text?: string;
}

const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
};

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className={cn('animate-spin text-primary', sizeClasses[size], className)} />
            {text && <p className="text-sm text-muted-foreground animate-pulse">{text}</p>}
        </div>
    );
}

interface LoadingOverlayProps {
    show: boolean;
    text?: string;
}

export function LoadingOverlay({ show, text = 'Carregando...' }: LoadingOverlayProps) {
    if (!show) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200">
            <LoadingSpinner size="lg" text={text} />
        </div>
    );
}

interface PageLoadingProps {
    text?: string;
}

export function PageLoading({ text = 'Carregando...' }: PageLoadingProps) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <LoadingSpinner size="xl" text={text} />
        </div>
    );
}
