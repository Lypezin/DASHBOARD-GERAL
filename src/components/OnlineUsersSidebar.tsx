import { CurrentUser } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSidebarController } from './OnlineUsersSidebar/useSidebarController';
import { SidebarTrigger } from './OnlineUsersSidebar/SidebarTrigger';
import { SidebarHeader } from './OnlineUsersSidebar/SidebarHeader';
import { UserList } from './OnlineUsersSidebar/UserList';
import { ChatWindow } from './OnlineUsersSidebar/ChatWindow';
import { NotificationsToast } from './OnlineUsersSidebar/NotificationsToast';

interface OnlineUsersSidebarProps {
    currentUser: CurrentUser | null;
    currentTab: string;
}

export function OnlineUsersSidebar({ currentUser, currentTab }: OnlineUsersSidebarProps) {
    const {
        isOpen, setIsOpen,
        onlineUsersData,
        searchTerm, setSearchTerm,
        myCustomStatus, setMyCustomStatus,
        notifications,
        activeChatUser, setActiveChatUser,
        chatInput, setChatInput,
        replyingTo, setReplyingTo,
        chatEndRef,
        unreadCounts,
        fileInputRef,
        activeMessages,
        filteredUsers,
        formatTimeOnline,
        totalUnread,
        onlineUsers,
        handleFileUpload
    } = useSidebarController(currentUser, currentTab);

    if (!currentUser) return null;

    const { setCustomStatus, sendMessage, setTypingTo, reactToMessage, pinMessage } = onlineUsersData;

    return (
        <>
            <SidebarTrigger
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                onlineCount={onlineUsers.length}
                unreadCount={totalUnread}
            />

            <div
                className={cn(
                    "fixed right-0 top-20 z-[9999] h-[calc(100vh-6rem)] transition-transform duration-300 ease-in-out bg-white shadow-lg border-l border-slate-200 rounded-l-xl flex flex-col w-80",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Hidden File Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                />

                <ChatWindow
                    currentUser={currentUser}
                    activeChatUser={activeChatUser!} // safe because of null check in component
                    setActiveChatUser={setActiveChatUser}
                    messages={activeMessages}
                    onReact={reactToMessage}
                    onPin={pinMessage}
                    onReply={setReplyingTo}
                    chatEndRef={chatEndRef}
                    chatInput={chatInput}
                    setChatInput={setChatInput}
                    handleSendMessage={() => {
                        if (!chatInput.trim() || !activeChatUser) return;
                        sendMessage(activeChatUser.id, chatInput, {
                            replyTo: replyingTo?.id
                        });
                        setChatInput('');
                        setReplyingTo(null);

                        // Notificação de envio
                        toast.success(`Mensagem enviada para ${activeChatUser.name?.split(' ')[0]}`);
                    }}
                    replyingTo={replyingTo}
                    fileInputRef={fileInputRef}
                    onlineUsers={onlineUsers}
                    setTypingTo={setTypingTo}
                />

                <NotificationsToast
                    notifications={notifications}
                />

                <SidebarHeader
                    isOpen={isOpen}
                    onlineCount={onlineUsers.length}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    myCustomStatus={myCustomStatus}
                    setMyCustomStatus={setMyCustomStatus}
                    onStatusSubmit={setCustomStatus}
                />

                <UserList
                    isOpen={isOpen}
                    currentUser={currentUser}
                    filteredUsers={filteredUsers}
                    unreadCounts={unreadCounts}
                    onUserClick={(user) => { setActiveChatUser(user); setIsOpen(true); }}
                    formatTimeOnline={formatTimeOnline}
                />

                {isOpen && (
                    <div className="p-2 text-center border-t border-slate-100 text-[10px] text-slate-300 bg-slate-50/50 rounded-bl-xl">
                        Atualizado em tempo real
                    </div>
                )}
            </div>
        </>
    );
}
