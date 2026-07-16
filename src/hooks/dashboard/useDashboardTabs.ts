import { useState, useCallback, useEffect, startTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { prefetchDashboardTabResources } from './prefetchDashboardTabResources';
import { TabType } from '@/types';
import { parseDashboardTab } from './dashboardTabsConfig';

export function useDashboardTabs() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const getInitialTab = useCallback((): TabType => {
        return parseDashboardTab(searchParams.get('tab'));
    }, [searchParams]);

    const [activeTab, setActiveTabState] = useState<TabType>(getInitialTab());

    useEffect(() => {
        prefetchDashboardTabResources(activeTab);
    }, [activeTab]);

    const setActiveTab = useCallback((newTab: TabType) => {
        prefetchDashboardTabResources(newTab);
        // Envolvemos a atualização de estado (que reflete na interface) 
        // e o roteador do Next.js (URL) numa Transition para não travar 
        // o navegador em caso de tabelas massivas, eliminando os "cliques perdidos"
        startTransition(() => {
            setActiveTabState(newTab);
            const isDashboardRoute = pathname === '/';
            const targetPathname = isDashboardRoute ? pathname : '/';
            const params = new URLSearchParams(isDashboardRoute ? searchParams.toString() : '');
            if (newTab === 'dashboard') {
                params.delete('tab');
            } else {
                params.set('tab', newTab);
            }
            const queryString = params.toString();
            const url = queryString ? `${targetPathname}?${queryString}` : targetPathname;
            router.replace(url, { scroll: false });
        });
    }, [pathname, router, searchParams]);

    useEffect(() => {
        const urlTab = getInitialTab();
        if (urlTab !== activeTab) {
            startTransition(() => {
                setActiveTabState(urlTab);
            });
        }
    }, [searchParams, activeTab, getInitialTab]);

    return { activeTab, setActiveTab, handleTabChange: setActiveTab, prefetchTabResources: prefetchDashboardTabResources };
}
