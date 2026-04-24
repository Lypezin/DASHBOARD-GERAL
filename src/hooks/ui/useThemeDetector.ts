import { useTheme } from '@/contexts/ThemeContext';

export function useThemeDetector() {
    const { theme } = useTheme();
    return theme === 'dark';
}
