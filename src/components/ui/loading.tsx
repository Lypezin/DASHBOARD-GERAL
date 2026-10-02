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
        <div className="flex flex-col items-center justify-center gap-3 text-center">
            <span className="relative flex items-center justify-center">
                <span className={cn('absolute rounded-full bg-blue-500/10 blur-md', sizeClasses[size])} />
                <Loader2 className={cn('relative animate-spin text-blue-600 dark:text-blue-300', sizeClasses[size], className)} />
            </span>
            {text && <p className="max-w-xs text-sm font-medium text-slate-500 dark:text-slate-400">{text}</p>}
        </div>
    );
}

interface PageLoadingProps {
    text?: string;
}

export function PageLoading({ text = 'Carregando...' }: PageLoadingProps) {
    return (
        <div className="folhas-world flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-center shadow-sm">
                <LoadingSpinner size="xl" text={text} />
                <div className="mx-auto mt-6 h-1.5 w-44 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-1/2 animate-[loading-bar_1.2s_ease-in-out_infinite] rounded-full bg-primary" />
                </div>
            </div>
        </div>
    );
}
