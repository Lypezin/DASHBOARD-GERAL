import { Header } from '@/components/Header';
import { UserActivityTracker } from '@/components/UserActivityTracker';
import { AuthSessionProvider } from '@/contexts/AuthSessionContext';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { GamificationProvider } from '@/contexts/GamificationContext';

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthSessionProvider>
      <OrganizationProvider>
        <GamificationProvider>
          <UserActivityTracker />
          <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex-1 transition-all duration-300">{children}</main>
          </div>
        </GamificationProvider>
      </OrganizationProvider>
    </AuthSessionProvider>
  );
}
