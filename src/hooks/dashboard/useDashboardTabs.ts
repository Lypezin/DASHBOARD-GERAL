import { useState, useCallback, useEffect, startTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { TabType } from '@/types';

const VALID_TABS = ['dashboard', 'analise', 'utr', 'entregadores', 'valores', 'evolucao', 'prioridade', 'comparacao', 'marketing', 'marketing_comparacao', 'dedicado'];

export function useDashboardTabs() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const getInitialTab = useCallback((): TabType => {
        const tabParam = searchParams.get('tab');
        if (tabParam && VALID_TABS.includes(tabParam)) {
            return tabParam as TabType;
        }
        return 'dashboard';
    }, [searchParams]);

    const [activeTab, setActiveTabState] = useState<TabType>(getInitialTab());

    const setActiveTab = useCallback((newTab: TabType) => {
        // Envolvemos a atualização de estado (que reflete na interface) 
        // e o roteador do Next.js (URL) numa Transition para não travar 
        // o navegador em caso de tabelas massivas, eliminando os "cliques perdidos"
        startTransition(() => {
            setActiveTabState(newTab);
            const params = new URLSearchParams(searchParams.toString());
            if (newTab === 'dashboard') {
                params.delete('tab');
            } else {
                params.set('tab', newTab);
            }
            const queryString = params.toString();
            const url = queryString ? `${pathname}?${queryString}` : pathname;
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

    return { activeTab, setActiveTab, handleTabChange: setActiveTab };
}
