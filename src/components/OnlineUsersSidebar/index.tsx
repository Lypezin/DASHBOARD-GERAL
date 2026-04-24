import { useCallback, useMemo } from 'react';
import { CurrentUser } from '@/types';
import { useSidebarController } from './useSidebarController';
import { SidebarTrigger } from './SidebarTrigger';
import { SidebarHeader } from './SidebarHeader';
import { UserList } from './UserList';
import { ChatWindow } from './ChatWindow';
import { NotificationsToast } from './NotificationsToast';
import { createSendMessageHandler } from './sendMessageHandler';
import { SidebarContainer } from './SidebarContainer';

interface OnlineUsersSidebarProps {
    currentUser: CurrentUser | null;
    currentTab: string;
    initialOpen?: boolean;
    preloadRealtime?: boolean;
}

export function OnlineUsersSidebar({
    currentUser,
    currentTab,
    initialOpen = false,
    preloadRealtime = false
}: OnlineUsersSidebarProps) {
    const {
        isOpen, setIsOpen, onlineUsersData, searchTerm, setSearchTerm,
        myCustomStatus, setMyCustomStatus, notifications, activeChatUser,
        setActiveChatUser, chatInput, setChatInput, replyingTo, setReplyingTo,
        chatEndRef, unreadCounts, fileInputRef, activeMessages, filteredUsers,
        formatTimeOnline, totalUnread, onlineUsers, handleFileUpload
    } = useSidebarController(currentUser, currentTab, initialOpen, preloadRealtime);

    if (!currentUser) return null;

    const { setCustomStatus, sendMessage, setTypingTo, reactToMessage, pinMessage } = onlineUsersData;
    const availableCount = useMemo(
        () => onlineUsers.filter((user) => !user.is_idle).length,
        [onlineUsers]
    );

    const handleSendMessage = createSendMessageHandler({
        chatInput,
        activeChatUser,
        replyingTo,
        sendMessage,
        setChatInput,
        setReplyingTo,
        clearTyping: () => setTypingTo(null)
    });

    const handleCloseSidebar = useCallback(() => setIsOpen(false), [setIsOpen]);
    const handleOpenUserChat = useCallback((user: typeof onlineUsers[number]) => {
        setActiveChatUser(user);
        setIsOpen(true);
    }, [setActiveChatUser, setIsOpen]);

    return (
        <>
            <SidebarTrigger
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                onlineCount={onlineUsers.length}
                unreadCount={totalUnread}
            />

            <SidebarContainer isOpen={isOpen} onClose={handleCloseSidebar}>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />

                <ChatWindow
                    currentUser={currentUser}
                    activeChatUser={activeChatUser!}
                    setActiveChatUser={setActiveChatUser}
                    messages={activeMessages}
                    onReact={reactToMessage}
                    onPin={pinMessage}
                    onReply={setReplyingTo}
                    chatEndRef={chatEndRef}
                    chatInput={chatInput}
                    setChatInput={setChatInput}
                    handleSendMessage={handleSendMessage}
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
                    availableCount={availableCount}
                    unreadCount={totalUnread}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    myCustomStatus={myCustomStatus}
                    setMyCustomStatus={setMyCustomStatus}
                    onStatusSubmit={setCustomStatus}
                    onClose={handleCloseSidebar}
                />

                <UserList
                    isOpen={isOpen}
                    currentUser={currentUser}
                    filteredUsers={filteredUsers}
                    unreadCounts={unreadCounts}
                    onUserClick={handleOpenUserChat}
                    formatTimeOnline={formatTimeOnline}
                />
            </SidebarContainer>
        </>
    );
}
