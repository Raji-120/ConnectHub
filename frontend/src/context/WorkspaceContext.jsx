import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [channels, setChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [userRole, setUserRole] = useState('member');

  // Fetch workspaces user is a member of
  const fetchWorkspaces = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await axiosClient.get('/workspaces');
      if (res.data?.success) {
        const wsList = res.data.workspaces || [];
        setWorkspaces(wsList);

        // Retain or select default workspace
        if (wsList.length > 0) {
          const savedWsId = localStorage.getItem('connecthub_active_ws');
          const matched = wsList.find((w) => w._id === savedWsId) || wsList[0];
          setCurrentWorkspace(matched);
        } else {
          setCurrentWorkspace(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch workspaces:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // When current workspace changes, load its channels and update role
  useEffect(() => {
    if (!currentWorkspace || !user) {
      setChannels([]);
      setCurrentChannel(null);
      return;
    }

    localStorage.setItem('connecthub_active_ws', currentWorkspace._id);

    // Determine current user's role in this workspace
    const memberEntry = currentWorkspace.members?.find(
      (m) => (m.user?._id || m.user) === user._id
    );
    setUserRole(memberEntry?.role || (currentWorkspace.owner?._id === user._id ? 'owner' : 'member'));

    // Fetch channels for current workspace
    const fetchChannels = async () => {
      try {
        setChannelsLoading(true);
        const res = await axiosClient.get(`/workspaces/${currentWorkspace._id}/channels`);
        if (res.data?.success) {
          const chList = res.data.channels || [];
          setChannels(chList);

          // Auto-select #general or first channel if none selected
          if (!activeConversation) {
            const general = chList.find((c) => c.name === 'general') || chList[0];
            setCurrentChannel(general || null);
          }
        }
      } catch (err) {
        console.error('Failed to fetch channels:', err);
      } finally {
        setChannelsLoading(false);
      }
    };

    fetchChannels();
  }, [currentWorkspace, user, activeConversation]);

  // Select workspace
  const selectWorkspace = (ws) => {
    setCurrentWorkspace(ws);
    setActiveConversation(null); // Clear DM when switching workspace
  };

  // Select channel
  const selectChannel = (ch) => {
    setCurrentChannel(ch);
    setActiveConversation(null); // Switch from DM to channel
  };

  // Select DM conversation
  const selectConversation = (conv) => {
    setActiveConversation(conv);
    setCurrentChannel(null); // Switch from channel to DM
  };

  // Create Workspace
  const createWorkspace = async (data) => {
    try {
      const res = await axiosClient.post('/workspaces', data);
      if (res.data?.success) {
        const newWs = res.data.workspace;
        setWorkspaces((prev) => [newWs, ...prev]);
        setCurrentWorkspace(newWs);
        if (res.data.channels) {
          setChannels(res.data.channels);
          setCurrentChannel(res.data.channels[0] || null);
        }
        return { success: true, workspace: newWs };
      }
      throw new Error(res.data?.message || 'Failed to create workspace');
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Update Workspace
  const updateWorkspace = async (data) => {
    if (!currentWorkspace) return { success: false, error: 'No active workspace' };
    try {
      const res = await axiosClient.put(`/workspaces/${currentWorkspace._id}`, data);
      if (res.data?.success) {
        const updated = res.data.workspace;
        setCurrentWorkspace(updated);
        setWorkspaces((prev) =>
          prev.map((w) => (w._id === updated._id ? { ...w, ...updated } : w))
        );
        return { success: true, workspace: updated };
      }
      throw new Error(res.data?.message || 'Failed to update workspace');
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Create Channel
  const createChannel = async (data) => {
    if (!currentWorkspace) return { success: false, error: 'No active workspace' };
    try {
      const res = await axiosClient.post(
        `/workspaces/${currentWorkspace._id}/channels`,
        data
      );
      if (res.data?.success) {
        const newChannel = res.data.channel;
        setChannels((prev) => [...prev, newChannel]);
        setCurrentChannel(newChannel);
        setActiveConversation(null);
        return { success: true, channel: newChannel };
      }
      throw new Error(res.data?.message || 'Failed to create channel');
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Delete Channel
  const deleteChannel = async (channelId) => {
    if (!currentWorkspace) return { success: false };
    try {
      const res = await axiosClient.delete(
        `/workspaces/${currentWorkspace._id}/channels/${channelId}`
      );
      if (res.data?.success) {
        setChannels((prev) => prev.filter((c) => c._id !== channelId));
        if (currentChannel?._id === channelId) {
          const remaining = channels.filter((c) => c._id !== channelId);
          setCurrentChannel(remaining[0] || null);
        }
        return { success: true };
      }
      throw new Error(res.data?.message || 'Failed to delete channel');
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Invite member
  const inviteMember = async (email, role = 'member') => {
    if (!currentWorkspace) return { success: false, error: 'No active workspace' };
    try {
      const res = await axiosClient.post(
        `/workspaces/${currentWorkspace._id}/members`,
        { email, role }
      );
      if (res.data?.success) {
        const updated = res.data.workspace;
        setCurrentWorkspace(updated);
        setWorkspaces((prev) =>
          prev.map((w) => (w._id === updated._id ? updated : w))
        );
        return { success: true, message: res.data.message };
      }
      throw new Error(res.data?.message || 'Failed to invite member');
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Update member role
  const updateMemberRole = async (userId, role) => {
    if (!currentWorkspace) return { success: false };
    try {
      const res = await axiosClient.put(
        `/workspaces/${currentWorkspace._id}/members/${userId}/role`,
        { role }
      );
      if (res.data?.success) {
        // Refresh workspace
        await fetchWorkspaces();
        return { success: true };
      }
      throw new Error(res.data?.message || 'Failed to update member role');
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Remove member
  const removeMember = async (userId) => {
    if (!currentWorkspace) return { success: false };
    try {
      const res = await axiosClient.delete(
        `/workspaces/${currentWorkspace._id}/members/${userId}`
      );
      if (res.data?.success) {
        if (userId === user._id) {
          // If leaving workspace
          fetchWorkspaces();
        } else {
          setCurrentWorkspace((prev) => ({
            ...prev,
            members: prev.members.filter(
              (m) => (m.user?._id || m.user) !== userId
            ),
          }));
        }
        return { success: true };
      }
      throw new Error(res.data?.message || 'Failed to remove member');
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Join by invite code
  const joinByInviteCode = async (inviteCode) => {
    try {
      const res = await axiosClient.post(`/workspaces/join/${inviteCode}`);
      if (res.data?.success) {
        const newWs = res.data.workspace;
        setWorkspaces((prev) => [newWs, ...prev]);
        setCurrentWorkspace(newWs);
        return { success: true, workspace: newWs };
      }
      throw new Error(res.data?.message || 'Failed to join workspace');
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        channels,
        currentChannel,
        activeConversation,
        loading,
        channelsLoading,
        userRole,
        selectWorkspace,
        selectChannel,
        selectConversation,
        fetchWorkspaces,
        createWorkspace,
        updateWorkspace,
        createChannel,
        deleteChannel,
        inviteMember,
        updateMemberRole,
        removeMember,
        joinByInviteCode,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
