import { CurrentUser } from '@/types';
import { cn } from '@/lib/utils';
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
}

export function OnlineUsersSidebar({ currentUser, currentTab }: OnlineUsersSidebarProps) {
    const {
        isOpen, setIsOpen, onlineUsersData, searchTerm, setSearchTerm,
        myCustomStatus, setMyCustomStatus, notifications, activeChatUser,
        setActiveChatUser, chatInput, setChatInput, replyingTo, setReplyingTo,
        chatEndRef, unreadCounts, fileInputRef, activeMessages, filteredUsers,
        formatTimeOnline, totalUnread, onlineUsers, handleFileUpload
    } = useSidebarController(currentUser, currentTab);

    if (!currentUser) return null;

    const { setCustomStatus, sendMessage, setTypingTo, reactToMessage, pinMessage } = onlineUsersData;

    const handleSendMessage = createSendMessageHandler({
        chatInput,
        activeChatUser,
        replyingTo,
        sendMessage,
        setChatInput,
        setReplyingTo
    });

    return (
        <>
            <SidebarTrigger
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                onlineCount={onlineUsers.length}
                unreadCount={totalUnread}
            />

            <SidebarContainer isOpen={isOpen}>
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
            </SidebarContainer>
        </>
    );
}
