import { CurrentUser } from '@/types';
import { useSidebarController } from './useSidebarController';
import { SidebarTrigger } from './SidebarTrigger';
import { SidebarHeader } from './SidebarHeader';
import { UserList } from './UserList';
import { ChatWindow } from './ChatWindow';
import { NotificationsToast } from './NotificationsToast';
import { createSendMessageHandler } from './sendMessageHandler';
import { SidebarContainer } from './SidebarContainer';
import { UserProfilePreview } from './UserProfilePreview';

interface OnlineUsersSidebarProps {
    currentUser: CurrentUser | null;
    currentTab: string;
}

export function OnlineUsersSidebar({ currentUser, currentTab }: OnlineUsersSidebarProps) {
    const {
        isOpen, setIsOpen, onlineUsersData, searchTerm, setSearchTerm,
        myCustomStatus, setMyCustomStatus, notifications, activeChatUser,
        setActiveChatUser, selectedProfileUser, setSelectedProfileUser, chatInput, setChatInput, replyingTo, setReplyingTo,
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
        setReplyingTo,
        clearTyping: () => setTypingTo(null)
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
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    myCustomStatus={myCustomStatus}
                    setMyCustomStatus={setMyCustomStatus}
                    onStatusSubmit={setCustomStatus}
                />

                <UserProfilePreview
                    user={selectedProfileUser}
                    currentUserId={currentUser.id}
                    unreadCount={selectedProfileUser ? (unreadCounts[selectedProfileUser.id] || 0) : 0}
                    onStartChat={(user) => {
                        setSelectedProfileUser(user);
                        setActiveChatUser(user);
                        setIsOpen(true);
                    }}
                    formatTimeOnline={formatTimeOnline}
                />

                <UserList
                    isOpen={isOpen}
                    currentUser={currentUser}
                    filteredUsers={filteredUsers}
                    unreadCounts={unreadCounts}
                    selectedUserId={selectedProfileUser?.id}
                    onUserSelect={(user) => {
                        setSelectedProfileUser(user);
                        setIsOpen(true);
                    }}
                    onUserClick={(user) => {
                        setSelectedProfileUser(user);
                        setActiveChatUser(user);
                        setIsOpen(true);
                    }}
                    formatTimeOnline={formatTimeOnline}
                />
            </SidebarContainer>
        </>
    );
}
