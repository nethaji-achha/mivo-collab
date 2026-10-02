'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Hash,
  Lock,
  Plus,
  Search,
  Video,
  Smile,
  Code,
  Send,
  Users,
  MessageSquare,
  ArrowRight,
  X,
  UserPlus,
  UserCheck,
  Globe,
  Shield,
  Sparkles,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { getSignalingSocket } from '@/lib/socket';
import { ChatChannel, TeamMessage, TeammatePresence } from '@mivo/types';
import { format } from 'date-fns';

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '🚀', '😂', '👏', '🎉', '☕', '💡', '⚡'];

const DEMO_PERSONAS = [
  { key: 'alex', name: 'Alex Rivera', role: 'Platform Host', emoji: '👤' },
  { key: 'sarah', name: 'Sarah Chen', role: 'Org Admin', emoji: '👩‍💼' },
  { key: 'liam', name: 'Liam Smith', role: 'Senior Engineer', emoji: '👨‍💻' },
  { key: 'maya', name: 'Maya Patel', role: 'Lead UX Designer', emoji: '🎨' },
  { key: 'david', name: 'David Kim', role: 'SFU Media Lead', emoji: '⚡' },
  { key: 'elena', name: 'Elena Rostova', role: 'VP of Product', emoji: '📊' },
];

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, demoLogin, primaryOrg } = useAuth();

  // Navigation / Selection State
  const [activeTab, setActiveTab] = useState<'channel' | 'direct'>('channel');
  const [activeChannelId, setActiveChannelId] = useState<string>('chan_general');
  const [activeDirectUserId, setActiveDirectUserId] = useState<string>('');

  // Data State
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [teammates, setTeammates] = useState<TeammatePresence[]>([]);
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [filterQuery, setFilterQuery] = useState('');

  // Input & Formatting State
  const [inputMessage, setInputMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState('typescript');
  const [codeContent, setCodeContent] = useState('');

  // Channel Creation Modal State
  const [showNewChannelModal, setShowNewChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [newChannelPrivate, setNewChannelPrivate] = useState(false);
  const [createChannelError, setCreateChannelError] = useState('');

  // Teammate / New Direct Chat Modal State
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newPersonEmail, setNewPersonEmail] = useState('');
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonRole, setNewPersonRole] = useState('Colleague');
  const [newChatError, setNewChatError] = useState('');
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  // Real-time typing state
  const [typingUsers, setTypingUsers] = useState<{ [id: string]: string }>({});

  // Auto-scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  // 1. Initial Load: Channels & Teammates
  useEffect(() => {
    loadSidebarData();
  }, [user?.id]);

  const loadSidebarData = async () => {
    try {
      const [channelsRes, teammatesRes] = await Promise.all([
        api.getChannels(),
        api.getDirectTeammates(),
      ]);

      if (channelsRes.success && channelsRes.data) {
        setChannels(channelsRes.data);
      }

      if (teammatesRes.success && teammatesRes.data) {
        setTeammates(teammatesRes.data);

        // If user came from query params or first teammate
        const directParam = searchParams.get('dm');
        if (directParam) {
          setActiveTab('direct');
          setActiveDirectUserId(directParam);
        } else if (!activeDirectUserId && teammatesRes.data.length > 0) {
          setActiveDirectUserId(teammatesRes.data[0].userId);
        }
      }
    } catch (err) {
      console.error('Failed to load chat data:', err);
    }
  };

  // 2. Load Messages when Active Channel or Direct User changes
  useEffect(() => {
    if (activeTab === 'channel' && activeChannelId) {
      loadChannelMessages(activeChannelId);
    } else if (activeTab === 'direct' && activeDirectUserId) {
      loadDirectMessages(activeDirectUserId);
    }
  }, [activeTab, activeChannelId, activeDirectUserId, user?.id]);

  const loadChannelMessages = async (channelId: string) => {
    try {
      const res = await api.getChannelMessages(channelId);
      if (res.success && res.data) {
        setMessages(res.data);
        scrollToBottom();
      }
    } catch (err) {
      console.error('Failed to load channel messages:', err);
    }
  };

  const loadDirectMessages = async (recipientId: string) => {
    try {
      const res = await api.getDirectMessages(recipientId);
      if (res.success && res.data) {
        setMessages(res.data);
        scrollToBottom();
      }
    } catch (err) {
      console.error('Failed to load direct messages:', err);
    }
  };

  // 3. Socket.IO Real-time Subscriptions
  useEffect(() => {
    if (!user) return;

    const socket = getSignalingSocket();
    socketRef.current = socket;

    socket.emit('chat:user-join', { userId: user.id });

    if (activeTab === 'channel' && activeChannelId) {
      socket.emit('chat:channel-join', { channelId: activeChannelId, userId: user.id });
    }

    const handleChannelMessage = (data: { channelId: string; message: TeamMessage }) => {
      if (activeTab === 'channel' && data.channelId === activeChannelId) {
        setMessages((prev) => [...prev, data.message]);
        scrollToBottom();
      }
    };

    const handleDirectMessage = (data: { recipientId: string; message: TeamMessage }) => {
      if (
        activeTab === 'direct' &&
        (data.message.senderId === activeDirectUserId || data.recipientId === activeDirectUserId)
      ) {
        setMessages((prev) => [...prev, data.message]);
        scrollToBottom();
      }
    };

    const handleReaction = (data: { targetId: string; messageId: string; reactions: Record<string, string[]> }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === data.messageId ? { ...msg, reactions: data.reactions } : msg))
      );
    };

    const handleTyping = (data: { targetType: string; targetId: string; userName: string; isTyping: boolean }) => {
      if (
        (activeTab === 'channel' && data.targetType === 'channel' && data.targetId === activeChannelId) ||
        (activeTab === 'direct' && data.targetType === 'direct' && data.targetId === user.id)
      ) {
        if (data.isTyping) {
          setTypingUsers((prev) => ({ ...prev, [data.userName]: data.userName }));
        } else {
          setTypingUsers((prev) => {
            const copy = { ...prev };
            delete copy[data.userName];
            return copy;
          });
        }
      }
    };

    socket.on('chat:channel-message', handleChannelMessage);
    socket.on('chat:direct-message', handleDirectMessage);
    socket.on('chat:reaction', handleReaction);
    socket.on('chat:typing', handleTyping);

    return () => {
      if (activeTab === 'channel' && activeChannelId) {
        socket.emit('chat:channel-leave', { channelId: activeChannelId });
      }
      socket.off('chat:channel-message', handleChannelMessage);
      socket.off('chat:direct-message', handleDirectMessage);
      socket.off('chat:reaction', handleReaction);
      socket.off('chat:typing', handleTyping);
    };
  }, [user, activeTab, activeChannelId, activeDirectUserId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // 4. Send Message Handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() && !codeContent.trim()) return;

    const payload: any = {
      content: inputMessage.trim() || 'Shared a code snippet:',
    };

    if (codeContent.trim()) {
      payload.codeSnippet = {
        code: codeContent.trim(),
        language: codeLanguage,
      };
    }

    try {
      if (activeTab === 'channel') {
        const res = await api.sendChannelMessage(activeChannelId, payload);
        if (res.success && res.data) {
          setMessages((prev) => [...prev, res.data!]);
          socketRef.current?.emit('chat:channel-message', {
            channelId: activeChannelId,
            message: res.data,
          });
        }
      } else {
        const res = await api.sendDirectMessage(activeDirectUserId, payload);
        if (res.success && res.data) {
          setMessages((prev) => [...prev, res.data!]);
          socketRef.current?.emit('chat:direct-message', {
            recipientId: activeDirectUserId,
            message: res.data,
          });
        }
      }

      setInputMessage('');
      setCodeContent('');
      setShowCodeInput(false);
      setShowEmojiPicker(false);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // 5. Start 1-Click Instant Video Meeting Huddle
  const handleStartInstantCall = async () => {
    try {
      const activeRecipient = teammates.find((t) => t.userId === activeDirectUserId);
      const activeChannel = channels.find((c) => c.id === activeChannelId);

      const title =
        activeTab === 'direct'
          ? `1-on-1 Huddle: ${user?.name || 'Me'} & ${activeRecipient?.name || 'Teammate'}`
          : `#${activeChannel?.name || 'team'} Office Video Sync`;

      const meetingRes = await api.createMeeting({
        title,
        type: 'instant',
      });

      if (meetingRes.success && meetingRes.data) {
        const meetingId = meetingRes.data.publicMeetingId;

        // Post meeting invite card to the current chat
        const invitePayload: any = {
          content: `🎥 Started an instant video meeting: **${title}**`,
          meetingInvite: {
            meetingId,
            title,
            status: 'active',
            startedByName: user?.name || 'Teammate',
          },
        };

        if (activeTab === 'channel') {
          const res = await api.sendChannelMessage(activeChannelId, invitePayload);
          if (res.success && res.data) {
            setMessages((prev) => [...prev, res.data!]);
            socketRef.current?.emit('chat:channel-message', {
              channelId: activeChannelId,
              message: res.data,
            });
          }
        } else {
          const res = await api.sendDirectMessage(activeDirectUserId, invitePayload);
          if (res.success && res.data) {
            setMessages((prev) => [...prev, res.data!]);
            socketRef.current?.emit('chat:direct-message', {
              recipientId: activeDirectUserId,
              message: res.data,
            });
          }
        }

        router.push(`/join/${meetingId}`);
      }
    } catch (err) {
      console.error('Failed to start instant call:', err);
    }
  };

  // 6. Toggle Emoji Reaction
  const handleToggleReaction = async (messageId: string, emoji: string) => {
    try {
      const res = await api.reactToMessage(messageId, emoji);
      if (res.success && res.data) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, reactions: res.data!.reactions } : m))
        );
        socketRef.current?.emit('chat:reaction', {
          targetId: activeTab === 'channel' ? activeChannelId : activeDirectUserId,
          messageId,
          reactions: res.data.reactions,
        });
      }
    } catch (err) {
      console.error('Reaction error:', err);
    }
  };

  // 7. Create Channel Handler
  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateChannelError('');

    if (!newChannelName.trim()) {
      setCreateChannelError('Channel name is required');
      return;
    }

    try {
      const res = await api.createChannel({
        name: newChannelName.trim(),
        description: newChannelDesc.trim(),
        isPrivate: newChannelPrivate,
      });

      if (res.success && res.data) {
        setChannels((prev) => [...prev, res.data!]);
        setActiveTab('channel');
        setActiveChannelId(res.data.id);
        setShowNewChannelModal(false);
        setNewChannelName('');
        setNewChannelDesc('');
      } else {
        setCreateChannelError(res.error?.message || 'Failed to create channel');
      }
    } catch (err: any) {
      setCreateChannelError(err.message || 'Error creating channel');
    }
  };

  // 8. Start / Invite Direct Chat with Any Person
  const handleStartDirectChatWithPerson = async (email: string, name?: string, role?: string) => {
    setNewChatError('');
    try {
      const res = await api.startDirectChat({ email, name, role });
      if (res.success && res.data) {
        const newTeammate = res.data;
        setTeammates((prev) => {
          const exists = prev.some((t) => t.userId === newTeammate.userId);
          return exists ? prev : [newTeammate, ...prev];
        });
        setActiveTab('direct');
        setActiveDirectUserId(newTeammate.userId);
        setShowNewChatModal(false);
        setNewPersonEmail('');
        setNewPersonName('');
      } else {
        setNewChatError(res.error?.message || 'Could not start chat');
      }
    } catch (err: any) {
      setNewChatError(err.message || 'Failed to initiate conversation');
    }
  };

  // 9. Persona Switcher with Auto Reload
  const handlePersonaSwitch = async (roleKey: string) => {
    await demoLogin(roleKey as any);
    await loadSidebarData();
  };

  // Filtered lists
  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(filterQuery.toLowerCase())
  );
  const filteredTeammates = teammates.filter(
    (t) =>
      t.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const activeTeammate = teammates.find((t) => t.userId === activeDirectUserId);

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-dark-bg text-slate-100">
      {/* ============================================================ */}
      {/* 1. LEFT SIDEBAR: Channels & Teammates Directory */}
      {/* ============================================================ */}
      <aside className="w-72 sm:w-80 border-r border-white/5 bg-dark-surface/90 backdrop-blur-xl flex flex-col shrink-0">
        {/* Workspace Header & Persona Switcher */}
        <div className="p-4 border-b border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-mivo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-mivo-500/20">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">
                  {primaryOrg?.name || 'HyperDevelopers'}
                </h2>
                <div className="flex items-center space-x-1.5 text-[11px] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Office Team Space</span>
                </div>
              </div>
            </div>

            {/* Quick Button to Find / Start Chat with Any Person */}
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-1.5 bg-mivo-600/20 hover:bg-mivo-600/40 border border-mivo-500/30 text-mivo-300 hover:text-white rounded-lg transition-all"
              title="Find / Chat with Any Person"
            >
              <UserPlus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Persona Switcher Chips */}
          <div className="rounded-xl bg-white/5 p-2 border border-white/5 space-y-1.5">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1 flex items-center justify-between">
              <span>Switch Persona</span>
              <span className="text-mivo-400 font-semibold">Demo Sandbox</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {DEMO_PERSONAS.map((p) => {
                const isCurrent = user?.email?.toLowerCase().includes(p.key);
                return (
                  <button
                    key={p.key}
                    onClick={() => handlePersonaSwitch(p.key)}
                    className={`px-1.5 py-1 text-[10px] rounded-lg font-semibold transition-all text-center truncate ${
                      isCurrent
                        ? 'bg-gradient-to-r from-mivo-600 to-cyan-600 text-white shadow-md'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                    title={`${p.name} (${p.role})`}
                  >
                    {p.emoji} {p.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Filter Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search channels & colleagues..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs bg-dark-bg/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-mivo-500 transition-all"
            />
          </div>
        </div>

        {/* Channels & Teammates List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-6">
          {/* SECTION 1: Office Channels */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Channels
              </span>
              <button
                onClick={() => setShowNewChannelModal(true)}
                className="p-1 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-all"
                title="Create Channel"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-0.5">
              {filteredChannels.map((channel) => {
                const isActive = activeTab === 'channel' && activeChannelId === channel.id;
                return (
                  <button
                    key={channel.id}
                    onClick={() => {
                      setActiveTab('channel');
                      setActiveChannelId(channel.id);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-mivo-600 text-white shadow-md shadow-mivo-600/20'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      {channel.isPrivate ? (
                        <Lock className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                      ) : (
                        <Hash className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      )}
                      <span className="truncate">{channel.name}</span>
                    </div>

                    {channel.name === 'watercooler-breakroom' && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-semibold">
                        ☕ Office
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: Direct Messages (1-on-1 Personal Office Chats) */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Direct Messages
              </span>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="flex items-center space-x-1 text-[10px] text-mivo-400 hover:text-mivo-300 font-semibold p-1 hover:bg-white/5 rounded transition-colors"
                title="Find & Chat with Any Person"
              >
                <Plus className="h-3 w-3" />
                <span>New Chat</span>
              </button>
            </div>

            <div className="space-y-0.5">
              {filteredTeammates.map((teammate) => {
                const isActive = activeTab === 'direct' && activeDirectUserId === teammate.userId;
                return (
                  <button
                    key={teammate.userId}
                    onClick={() => {
                      setActiveTab('direct');
                      setActiveDirectUserId(teammate.userId);
                    }}
                    className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-mivo-600/90 to-cyan-600/90 text-white shadow-md'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {/* Teammate Avatar with Online/Meeting Status */}
                    <div className="relative shrink-0">
                      <img
                        src={
                          teammate.avatarUrl ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(teammate.name)}`
                        }
                        alt={teammate.name}
                        className="h-7 w-7 rounded-full object-cover border border-white/10"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-dark-card ${
                          teammate.status === 'online'
                            ? 'bg-emerald-400'
                            : teammate.status === 'in_meeting'
                            ? 'bg-amber-400 animate-pulse'
                            : teammate.status === 'busy'
                            ? 'bg-rose-500'
                            : 'bg-slate-500'
                        }`}
                        title={`Status: ${teammate.status}`}
                      />
                    </div>

                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="truncate font-semibold text-white">{teammate.name}</span>
                        {teammate.status === 'in_meeting' && (
                          <span className="text-[9px] font-bold text-amber-300 bg-amber-400/20 px-1 rounded">
                            In Call
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        {teammate.customStatus || teammate.role}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Current User Profile Footer */}
        <div className="p-3 border-t border-white/5 bg-dark-bg/60 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <img
              src={
                user?.avatarUrl ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'User')}`
              }
              alt="Me"
              className="h-8 w-8 rounded-full object-cover border border-mivo-500/40"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'My Account'}</p>
              <div className="flex items-center space-x-1 text-[10px] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Online in Office</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 2. MAIN CHAT AREA */}
      {/* ============================================================ */}
      <main className="flex-1 flex flex-col bg-dark-bg min-w-0">
        {/* Chat Header */}
        <header className="h-16 border-b border-white/5 px-6 flex items-center justify-between bg-dark-card/50 backdrop-blur-xl shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            {activeTab === 'channel' ? (
              <>
                <div className="h-9 w-9 rounded-lg bg-mivo-500/10 border border-mivo-500/20 flex items-center justify-center shrink-0">
                  <Hash className="h-5 w-5 text-mivo-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <h1 className="text-base font-bold text-white tracking-tight">
                      #{activeChannel?.name || 'general'}
                    </h1>
                    {activeChannel?.topic && (
                      <span className="hidden md:inline text-xs text-slate-400 font-normal truncate max-w-md">
                        • {activeChannel.topic}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {activeChannel?.description || 'Company and team communication channel'}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="relative shrink-0">
                  <img
                    src={
                      activeTeammate?.avatarUrl ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(activeTeammate?.name || 'Teammate')}`
                    }
                    alt={activeTeammate?.name}
                    className="h-9 w-9 rounded-full object-cover border border-white/10"
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-dark-card ${
                      activeTeammate?.status === 'online' ? 'bg-emerald-400' : 'bg-slate-400'
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <h1 className="text-base font-bold text-white tracking-tight">
                      {activeTeammate?.name || 'Office Colleague'}
                    </h1>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-medium">
                      {activeTeammate?.role || 'Teammate'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {activeTeammate?.email} • {activeTeammate?.customStatus || 'Active now'}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Header Action: 1-Click Instant Video Meeting Huddle */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={handleStartInstantCall}
              className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-mivo-600 to-cyan-500 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-mivo-500/25 hover:brightness-110 active:scale-95 transition-all"
            >
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Start Video Huddle</span>
              <span className="sm:hidden">Call</span>
            </button>
          </div>
        </header>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Welcome Banner at Top of Conversation */}
          <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent p-5 mb-6 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-mivo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-mivo-500/20 shrink-0">
                {activeTab === 'channel' ? (
                  <Hash className="h-6 w-6 text-white" />
                ) : (
                  <Users className="h-6 w-6 text-white" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  {activeTab === 'channel'
                    ? `Welcome to #${activeChannel?.name}!`
                    : `Direct conversation with ${activeTeammate?.name}`}
                </h3>
                <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                  {activeTab === 'channel'
                    ? activeChannel?.description || 'This is the start of the channel history.'
                    : 'Personal office direct messages are private, real-time, and support 1-click video calls.'}
                </p>
              </div>
            </div>
          </div>

          {/* Messages List */}
          {messages.map((message) => {
            const isMe = message.senderId === user?.id;
            return (
              <div
                key={message.id}
                className="group flex items-start space-x-3 hover:bg-white/[0.02] p-2 -mx-2 rounded-xl transition-colors"
              >
                {/* Sender Avatar */}
                <img
                  src={
                    message.senderAvatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(message.senderName)}`
                  }
                  alt={message.senderName}
                  className="h-9 w-9 rounded-full object-cover border border-white/10 shrink-0 mt-0.5"
                />

                {/* Message Body */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* Sender Header */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">{message.senderName}</span>
                    {message.senderRole && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-mivo-300 font-medium">
                        {message.senderRole}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500">
                      {format(new Date(message.createdAt), 'h:mm a')}
                    </span>
                  </div>

                  {/* Text Content */}
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed break-words whitespace-pre-wrap">
                    {message.content}
                  </p>

                  {/* Code Snippet (if present) */}
                  {message.codeSnippet && (
                    <div className="mt-2 rounded-xl bg-dark-card border border-white/10 p-3 overflow-x-auto">
                      <div className="flex items-center justify-between text-[10px] uppercase font-mono text-slate-400 pb-1.5 mb-1.5 border-b border-white/5">
                        <span>{message.codeSnippet.language}</span>
                        <span>Snippet</span>
                      </div>
                      <pre className="text-xs font-mono text-cyan-300 leading-relaxed">
                        <code>{message.codeSnippet.code}</code>
                      </pre>
                    </div>
                  )}

                  {/* Interactive Video Meeting Invite Card */}
                  {message.meetingInvite && (
                    <div className="mt-3 max-w-md rounded-xl border border-mivo-500/40 bg-gradient-to-r from-mivo-900/40 to-dark-card p-3.5 shadow-lg shadow-mivo-500/10 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                          <span className="text-xs font-bold text-white">
                            {message.meetingInvite.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-mivo-400 uppercase bg-mivo-500/20 px-2 py-0.5 rounded-full">
                          Live Room
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Started by {message.meetingInvite.startedByName}. Click below to join with HD video and audio.
                      </p>
                      <button
                        onClick={() => router.push(`/join/${message.meetingInvite?.meetingId}`)}
                        className="w-full flex items-center justify-center space-x-2 rounded-lg bg-mivo-600 hover:bg-mivo-500 py-1.5 text-xs font-semibold text-white transition-all shadow"
                      >
                        <Video className="h-3.5 w-3.5" />
                        <span>Join Video Room Now</span>
                      </button>
                    </div>
                  )}

                  {/* Emoji Reactions Row */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {message.reactions &&
                      Object.entries(message.reactions).map(([emoji, userIds]) => {
                        const hasReacted = userIds.includes(user?.id || '');
                        return (
                          <button
                            key={emoji}
                            onClick={() => handleToggleReaction(message.id, emoji)}
                            className={`inline-flex items-center space-x-1 rounded-full px-2 py-0.5 text-xs transition-all ${
                              hasReacted
                                ? 'bg-mivo-500/30 border border-mivo-500/50 text-white'
                                : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="text-[10px] font-semibold">{userIds.length}</span>
                          </button>
                        );
                      })}

                    {/* Quick Reaction Trigger */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                      {QUICK_EMOJIS.slice(0, 4).map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleToggleReaction(message.id, emoji)}
                          className="hover:scale-125 transition-transform text-xs p-0.5"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Real-time Typing Indicators */}
        {Object.keys(typingUsers).length > 0 && (
          <div className="px-6 py-1 text-[11px] text-slate-400 flex items-center space-x-1.5 italic">
            <span className="h-1.5 w-1.5 rounded-full bg-mivo-400 animate-pulse" />
            <span>{Object.values(typingUsers).join(', ')} is typing...</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* 3. RICH INPUT BAR */}
        {/* ============================================================ */}
        <div className="p-4 sm:p-6 border-t border-white/5 bg-dark-surface/50 backdrop-blur-xl">
          {/* Optional Code Snippet Input Box */}
          {showCodeInput && (
            <div className="mb-3 rounded-xl border border-white/10 bg-dark-card p-3 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <Code className="h-4 w-4 text-cyan-400" />
                  <span>Attach Code Snippet</span>
                </span>
                <select
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  className="bg-dark-bg border border-white/10 rounded px-2 py-0.5 text-xs text-white"
                >
                  <option value="typescript">TypeScript</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="sql">SQL</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              <textarea
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                placeholder="Paste your code snippet here..."
                rows={4}
                className="w-full bg-dark-bg border border-white/10 rounded-lg p-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          {/* Main Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="rounded-2xl border border-white/10 bg-dark-card/90 p-2 shadow-2xl focus-within:border-mivo-500 focus-within:ring-1 focus-within:ring-mivo-500 transition-all"
          >
            <textarea
              rows={2}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                activeTab === 'channel'
                  ? `Message #${activeChannel?.name || 'channel'}... (Press Enter to send)`
                  : `Message ${activeTeammate?.name || 'colleague'}...`
              }
              className="w-full resize-none bg-transparent px-3 py-1.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
            />

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between pt-1 px-1 border-t border-white/5">
              <div className="flex items-center space-x-1">
                {/* Quick Emoji Bar Toggle */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    title="Insert Emoji"
                  >
                    <Smile className="h-4 w-4" />
                  </button>

                  {showEmojiPicker && (
                    <div className="absolute bottom-10 left-0 rounded-xl border border-white/10 bg-dark-card p-2 shadow-2xl backdrop-blur-xl z-50 flex flex-wrap gap-1 w-52 animate-in fade-in">
                      {QUICK_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setInputMessage((prev) => prev + ' ' + emoji);
                            setShowEmojiPicker(false);
                          }}
                          className="p-1 text-base hover:scale-125 transition-transform"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Code Snippet Button */}
                <button
                  type="button"
                  onClick={() => setShowCodeInput(!showCodeInput)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    showCodeInput
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  title="Share Code Snippet"
                >
                  <Code className="h-4 w-4" />
                </button>

                {/* Instant Video Call Trigger inside chat */}
                <button
                  type="button"
                  onClick={handleStartInstantCall}
                  className="p-1.5 text-slate-400 hover:text-mivo-400 hover:bg-mivo-500/10 rounded-lg transition-colors"
                  title="Share Instant Video Room"
                >
                  <Video className="h-4 w-4" />
                </button>
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputMessage.trim() && !codeContent.trim()}
                className="inline-flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-mivo-600 to-cyan-500 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-mivo-500/20 hover:opacity-95 disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                <span>Send</span>
                <Send className="h-3 w-3" />
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* ============================================================ */}
      {/* 4. MODAL: FIND & START CHAT WITH OTHER PERSONS */}
      {/* ============================================================ */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-dark-card p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="h-9 w-9 rounded-xl bg-mivo-500/20 border border-mivo-500/30 flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-mivo-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Start Chat with Teammate</h3>
                  <p className="text-xs text-slate-400">Select any colleague or start a conversation with a new person</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {newChatError && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5 text-xs text-rose-300">
                {newChatError}
              </div>
            )}

            {/* Search Colleague Directory */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search colleagues by name or email..."
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-dark-bg border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-mivo-500"
                />
              </div>

              {/* Colleague Quick Directory */}
              <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                {teammates
                  .filter(
                    (t) =>
                      t.name.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
                      t.email.toLowerCase().includes(modalSearchQuery.toLowerCase())
                  )
                  .map((teammate) => (
                    <div
                      key={teammate.userId}
                      className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={
                              teammate.avatarUrl ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(teammate.name)}`
                            }
                            alt={teammate.name}
                            className="h-8 w-8 rounded-full object-cover border border-white/10"
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-dark-card ${
                              teammate.status === 'online' ? 'bg-emerald-400' : 'bg-slate-400'
                            }`}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{teammate.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{teammate.role} • {teammate.email}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setActiveTab('direct');
                          setActiveDirectUserId(teammate.userId);
                          setShowNewChatModal(false);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-mivo-600 hover:bg-mivo-500 text-xs font-semibold text-white transition-all shrink-0"
                      >
                        Chat Now
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            {/* Form to Add / Chat with Any New Person by Email */}
            <div className="pt-3 border-t border-white/10 space-y-3">
              <span className="text-xs font-bold text-slate-300 block">
                Or invite / start chat with a new colleague:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="email"
                  placeholder="Colleague Email (e.g. john@office.com)"
                  value={newPersonEmail}
                  onChange={(e) => setNewPersonEmail(e.target.value)}
                  className="h-9 px-3 rounded-lg bg-dark-bg border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-mivo-500"
                />
                <input
                  type="text"
                  placeholder="Name (Optional)"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  className="h-9 px-3 rounded-lg bg-dark-bg border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-mivo-500"
                />
              </div>
              <button
                type="button"
                disabled={!newPersonEmail.trim()}
                onClick={() => handleStartDirectChatWithPerson(newPersonEmail, newPersonName)}
                className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl bg-gradient-to-r from-mivo-600 to-cyan-500 text-xs font-bold text-white shadow-lg disabled:opacity-40 transition-all"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Start Direct Conversation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. MODAL: CREATE CHANNEL */}
      {/* ============================================================ */}
      {showNewChannelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-dark-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Hash className="h-5 w-5 text-mivo-400" />
                <span>Create Office Channel</span>
              </h3>
              <button
                onClick={() => setShowNewChannelModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {createChannelError && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5 text-xs text-rose-300">
                {createChannelError}
              </div>
            )}

            <form onSubmit={handleCreateChannel} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Channel Name
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. frontend-squad, standup, watercooler"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-lg bg-dark-bg border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-mivo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="What is this channel for?"
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-dark-bg border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-mivo-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <p className="text-xs font-semibold text-white">Private Channel</p>
                  <p className="text-[10px] text-slate-400">
                    Only invited members will be able to view and message
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={newChannelPrivate}
                  onChange={(e) => setNewChannelPrivate(e.target.checked)}
                  className="h-4 w-4 rounded border-white/10 text-mivo-600 focus:ring-mivo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewChannelModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-mivo-600 hover:bg-mivo-500 px-5 py-2 text-xs font-semibold text-white shadow-lg transition-all"
                >
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeamChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-dark-bg text-slate-400 text-xs">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-mivo-500 animate-ping" />
            <span>Loading Office Chat Space...</span>
          </div>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
