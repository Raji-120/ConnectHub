import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useSocket } from '../context/SocketContext';

// Layout Components
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';
import ChatHeader from '../components/chat/ChatHeader';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';
import TaskBoard from '../components/tasks/TaskBoard';

// Modals
import CreateWorkspaceModal from '../components/modals/CreateWorkspaceModal';
import CreateChannelModal from '../components/modals/CreateChannelModal';
import InviteMemberModal from '../components/modals/InviteMemberModal';
import ManageMembersModal from '../components/modals/ManageMembersModal';
import JoinWorkspaceModal from '../components/modals/JoinWorkspaceModal';
import ProfileModal from '../components/modals/ProfileModal';

export const DashboardPage = () => {
  const { user } = useAuth();
  const {
    currentWorkspace,
    currentChannel,
    activeConversation,
    selectConversation,
  } = useWorkspace();

  const {
    socket,
    onlineUserIds,
    typingUsers,
    unreadMap,
    joinChannel,
    leaveChannel,
    joinConversation,
    leaveConversation,
    emitTyping,
    reactToMessage,
    pinMessage,
  } = useSocket();

  // State
  const [messages, setMessages] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [isTasksView, setIsTasksView] = useState(false);

  // Modal open states
  const [createWsOpen, setCreateWsOpen] = useState(false);
  const [createChOpen, setCreateChOpen] = useState(false);
  const [inviteMemberOpen, setInviteMemberOpen] = useState(false);
  const [manageMembersOpen, setManageMembersOpen] = useState(false);
  const [joinWsOpen, setJoinWsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Fetch messages for active channel or conversation
  const fetchMessages = useCallback(async () => {
    if (!currentWorkspace?._id) return;

    try {
      setLoadingMessages(true);
      if (activeConversation?._id) {
        // Fetch DM messages
        const res = await axiosClient.get(
          `/workspaces/${currentWorkspace._id}/conversations/${activeConversation._id}/messages`
        );
        if (res.data?.success) {
          setMessages(res.data.messages || []);
        }
      } else if (currentChannel?._id) {
        // Fetch Channel messages
        const res = await axiosClient.get(
          `/workspaces/${currentWorkspace._id}/channels/${currentChannel._id}/messages`
        );
        if (res.data?.success) {
          setMessages(res.data.messages || []);
        }
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [currentWorkspace, currentChannel, activeConversation]);

  // Fetch pinned messages and shared files
  const fetchSidebarData = useCallback(async () => {
    if (!currentWorkspace?._id) return;
    try {
      const channelParam = currentChannel?._id ? `?channelId=${currentChannel._id}` : '';
      const [pinsRes, filesRes] = await Promise.all([
        axiosClient.get(`/workspaces/${currentWorkspace._id}/messages/pinned${channelParam}`),
        axiosClient.get(`/workspaces/${currentWorkspace._id}/messages/files${channelParam}`),
      ]);

      if (pinsRes.data?.success) setPinnedMessages(pinsRes.data.pinnedMessages || []);
      if (filesRes.data?.success) setSharedFiles(filesRes.data.files || []);
    } catch (err) {
      console.error('Failed to load pinned/files:', err);
    }
  }, [currentWorkspace, currentChannel]);

  useEffect(() => {
    fetchMessages();
    fetchSidebarData();
  }, [fetchMessages, fetchSidebarData]);

  // Socket room joining and event handling
  useEffect(() => {
    if (!socket) return;

    const currentChId = currentChannel?._id;
    const currentConvId = activeConversation?._id;

    if (currentChId) {
      joinChannel(currentChId);
    }
    if (currentConvId) {
      joinConversation(currentConvId);
    }

    const handleMessageReceived = (newMsg) => {
      // Check if message belongs to current channel or conversation
      const isForChannel = currentChId && newMsg.channel === currentChId;
      const isForConv = currentConvId && newMsg.conversation === currentConvId;

      if (isForChannel || isForConv) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });

        // Update shared files if file attached
        if (newMsg.fileUrl) {
          setSharedFiles((prev) => [
            {
              _id: newMsg._id,
              name: newMsg.fileName,
              url: newMsg.fileUrl,
              type: newMsg.fileType,
              size: newMsg.fileSize,
              createdAt: newMsg.createdAt,
              uploadedBy: newMsg.sender,
            },
            ...prev,
          ]);
        }
      }
    };

    const handleMessageUpdated = (updatedMsg) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m))
      );
      // Update pinned messages if pin status changed
      if (updatedMsg.isPinned) {
        setPinnedMessages((prev) => [
          updatedMsg,
          ...prev.filter((p) => p._id !== updatedMsg._id),
        ]);
      } else {
        setPinnedMessages((prev) =>
          prev.filter((p) => p._id !== updatedMsg._id)
        );
      }
    };

    socket.on('message:received', handleMessageReceived);
    socket.on('message:updated', handleMessageUpdated);

    return () => {
      socket.off('message:received', handleMessageReceived);
      socket.off('message:updated', handleMessageUpdated);
      if (currentChId) leaveChannel(currentChId);
      if (currentConvId) leaveConversation(currentConvId);
    };
  }, [socket, currentChannel, activeConversation, joinChannel, leaveChannel, joinConversation, leaveConversation]);

  // Send message handler (supports both text and file upload)
  const handleSendMessage = async (content, file) => {
    if (!currentWorkspace?._id) return;
    if (!currentChannel?._id && !activeConversation?._id) return;

    let fileUrl = '';
    let fileName = '';
    let fileType = '';
    let fileSize = 0;

    // Upload file if attached
    if (file) {
      try {
        setUploadingFile(true);
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await axiosClient.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (uploadRes.data?.success && uploadRes.data.file) {
          fileUrl = uploadRes.data.file.url;
          fileName = uploadRes.data.file.name;
          fileType = uploadRes.data.file.type;
          fileSize = uploadRes.data.file.size;
        }
      } catch (err) {
        console.error('File upload failed:', err);
        alert('File upload failed: ' + (err.message || 'Server error'));
        setUploadingFile(false);
        return;
      } finally {
        setUploadingFile(false);
      }
    }

    // Resolve conversation ID if direct message
    let conversationId = activeConversation?._id;
    if (activeConversation?.isDirect && !conversationId && activeConversation?.targetUser?._id) {
      try {
        const convRes = await axiosClient.post(
          `/workspaces/${currentWorkspace._id}/conversations/direct`,
          { targetUserId: activeConversation.targetUser._id }
        );
        if (convRes.data?.success) {
          conversationId = convRes.data.conversation._id;
          selectConversation(convRes.data.conversation);
          joinConversation(conversationId);
        }
      } catch (err) {
        console.error('Failed to create conversation:', err);
        return;
      }
    }

    const payload = {
      workspaceId: currentWorkspace._id,
      channelId: currentChannel?._id || null,
      conversationId: conversationId || null,
      content,
      fileUrl,
      fileName,
      fileType,
      fileSize,
    };

    // Use Socket.IO for real-time delivery + MongoDB persistence
    if (socket && socket.connected) {
      socket.emit('message:send', payload, (response) => {
        if (response?.error) {
          console.error('Socket message error:', response.error);
        }
      });
    } else {
      // Fallback to REST API
      try {
        const res = await axiosClient.post(
          `/workspaces/${currentWorkspace._id}/messages`,
          payload
        );
        if (res.data?.success && res.data.message) {
          setMessages((prev) => [...prev, res.data.message]);
        }
      } catch (err) {
        console.error('REST message error:', err);
      }
    }
  };

  const handleTyping = () => {
    emitTyping({
      channelId: currentChannel?._id,
      conversationId: activeConversation?._id,
    });
  };

  const handleReact = (messageId, emoji) => {
    reactToMessage(messageId, emoji, {
      channelId: currentChannel?._id,
      conversationId: activeConversation?._id,
    });
  };

  const handlePin = (messageId) => {
    pinMessage(messageId, {
      channelId: currentChannel?._id,
      conversationId: activeConversation?._id,
    });
  };

  const handleStartDirectMessage = async (targetUser) => {
    if (!currentWorkspace?._id) return;
    try {
      const res = await axiosClient.post(
        `/workspaces/${currentWorkspace._id}/conversations/direct`,
        { targetUserId: targetUser._id }
      );
      if (res.data?.success) {
        selectConversation(res.data.conversation);
        setIsTasksView(false);
      }
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }
  };

  return (
    <div className="h-screen w-screen flex bg-gray-950 text-gray-100 overflow-hidden font-sans">
      {/* Left Sidebar (Workspace rail + Channels & DMs) */}
      <LeftSidebar
        onOpenCreateWorkspace={() => setCreateWsOpen(true)}
        onOpenCreateChannel={() => setCreateChOpen(true)}
        onOpenInviteMember={() => setInviteMemberOpen(true)}
        onOpenManageMembers={() => setManageMembersOpen(true)}
        onOpenJoinWorkspace={() => setJoinWsOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onSelectTasksView={(val) => setIsTasksView(val)}
        isTasksView={isTasksView}
        unreadMap={unreadMap}
      />

      {/* Main Section */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-gray-950 relative">
        {isTasksView ? (
          <TaskBoard />
        ) : (
          <>
            {/* Chat Header */}
            <ChatHeader
              rightSidebarOpen={rightSidebarOpen}
              onToggleRightSidebar={() => setRightSidebarOpen(!rightSidebarOpen)}
            />

            {/* Message History */}
            <MessageList
              messages={messages}
              currentUserId={user?._id}
              currentChannel={currentChannel}
              activeConversation={activeConversation}
              typingUsers={typingUsers}
              onReact={handleReact}
              onPin={handlePin}
            />

            {/* Message Input */}
            <MessageInput
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
              uploading={uploadingFile}
              placeholder={
                activeConversation?.targetUser
                  ? `Message @${activeConversation.targetUser.name}`
                  : currentChannel
                  ? `Message #${currentChannel.name}`
                  : 'Select a conversation...'
              }
              disabled={!currentChannel && !activeConversation}
            />
          </>
        )}
      </main>

      {/* Right Sidebar (Members, Files, Pins) */}
      {!isTasksView && (
        <RightSidebar
          isOpen={rightSidebarOpen}
          onToggle={() => setRightSidebarOpen(false)}
          pinnedMessages={pinnedMessages}
          sharedFiles={sharedFiles}
          onStartDirectMessage={handleStartDirectMessage}
        />
      )}

      {/* Modals */}
      <CreateWorkspaceModal
        isOpen={createWsOpen}
        onClose={() => setCreateWsOpen(false)}
      />
      <CreateChannelModal
        isOpen={createChOpen}
        onClose={() => setCreateChOpen(false)}
      />
      <InviteMemberModal
        isOpen={inviteMemberOpen}
        onClose={() => setInviteMemberOpen(false)}
      />
      <ManageMembersModal
        isOpen={manageMembersOpen}
        onClose={() => setManageMembersOpen(false)}
      />
      <JoinWorkspaceModal
        isOpen={joinWsOpen}
        onClose={() => setJoinWsOpen(false)}
      />
      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </div>
  );
};

export default DashboardPage;
