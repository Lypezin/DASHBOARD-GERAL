
/**
 * Componente de menu mobile do Header
 */

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useHeaderAuth, UserProfile } from '@/hooks/auth/useHeaderAuth';
import { MobileUserHeader } from './Header/MobileUserHeader';
import { MobileNavContent } from './Header/MobileNavContent';

interface HeaderMobileMenuProps {
  user: UserProfile | null;
  avatarUrl: string | null;
  onLogout: () => void;
}

export const HeaderMobileMenu = React.memo(function HeaderMobileMenu({
  user,
  avatarUrl,
  onLogout,
}: HeaderMobileMenuProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle asChild>
            <MobileUserHeader user={user} avatarUrl={avatarUrl} />
          </SheetTitle>
        </SheetHeader>
        <MobileNavContent user={user} onLogout={onLogout} />
      </SheetContent>
    </Sheet>
  );
});

HeaderMobileMenu.displayName = 'HeaderMobileMenu';
