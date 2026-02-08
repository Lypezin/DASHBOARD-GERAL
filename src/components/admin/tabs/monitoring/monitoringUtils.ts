export function formatDuration(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

export function getPathName(path: string) {
    if (path === '/') return 'Dashboard Principal';
    return path.replace('/', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
