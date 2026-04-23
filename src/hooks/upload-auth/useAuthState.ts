import { useState, useRef, useEffect } from 'react';
import { User } from '@supabase/supabase-js';

function clearStoredTimeout(timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>) {
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
    }
}

export function useAuthState() {
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [user, setUser] = useState<User | { id: string } | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const isMountedRef = useRef(true);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            clearStoredTimeout(timeoutRef);
        };
    }, []);

    return {
        loading,
        setLoading,
        isAuthorized,
        setIsAuthorized,
        user,
        setUser,
        errorMessage,
        setErrorMessage,
        isMountedRef,
        timeoutRef
    };
}
