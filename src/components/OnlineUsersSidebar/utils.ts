
export const formatTimeOnline = (dateString: string) => {
    const start = new Date(dateString).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - start) / 1000 / 60);

    if (diff < 60) return `${diff}m`;
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
};
