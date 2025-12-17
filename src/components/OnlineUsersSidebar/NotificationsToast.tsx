interface Notification {
    id: string;
    message: string;
}

interface NotificationsToastProps {
    notifications: Notification[];
}

export function NotificationsToast({ notifications }: NotificationsToastProps) {
    if (notifications.length === 0) return null;

    return (
        <div className="absolute top-4 left-0 -translate-x-full pr-4 flex flex-col gap-2 pointer-events-none">
            {notifications.map(n => (
                <div key={n.id} className="bg-slate-800 text-white text-xs px-3 py-2 rounded shadow-lg animate-in fade-in slide-in-from-right-5 whitespace-nowrap">
                    {n.message} 🥳
                </div>
            ))}
        </div>
    );
}
