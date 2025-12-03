import { useState, useEffect } from 'react';

export function useThemeDetector() {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const checkTheme = () => {
            if (typeof window !== 'undefined') {
                setIsDarkMode(document.documentElement.classList.contains('dark'));
            }
        };

        checkTheme();

        const observer = new MutationObserver(() => {
            checkTheme();
        });

        if (typeof window !== 'undefined') {
            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['class']
            });
        }

        return () => observer.disconnect();
    }, []);

    return isDarkMode;
}
