
import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserProfile } from '@/hooks/useHeaderAuth';

interface DesktopNavLinksProps {
    user: UserProfile | null;
}

export const DesktopNavLinks: React.FC<DesktopNavLinksProps> = ({ user }) => {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <div className="flex items-center gap-1">
            <Button
                variant={pathname === '/' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => router.push('/')}
                className="text-sm font-medium"
            >
                Dashboard
            </Button>

            {user?.is_admin && (
                <>
                    <Button
                        variant={pathname === '/upload' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={(e) => {
                            e.preventDefault();
                            window.location.href = '/upload';
                        }}
                        className="text-sm font-medium"
                    >
                        Upload
                    </Button>
                    <Button
                        variant={pathname === '/admin' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={(e) => {
                            e.preventDefault();
                            window.location.href = '/admin';
                        }}
                        className="text-sm font-medium"
                    >
                        Admin
                    </Button>
                </>
            )}
        </div>
    );
};
