import { useState, useRef, useEffect } from 'react';
import { User } from '@supabase/supabase-js';

export function useAuthState() {
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [user, setUser] = useState<User | { id: string } | null>(null);
    const isMountedRef = useRef(true);
    const retryCountRef = useRef(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return {
        loading,
        setLoading,
        isAuthorized,
        setIsAuthorized,
        user,
        setUser,
        isMountedRef,
        retryCountRef,
        timeoutRef
    };
}
