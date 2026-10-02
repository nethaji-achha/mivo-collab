import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { DatabaseStore } from '../db';
import { CreateChannelSchema, SendTeamMessageSchema, ReactMessageSchema } from '@mivo/validation';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { recordAuditLog } from '../middleware/audit.middleware';
import { ChatChannel, TeamMessage, TeammatePresence } from '@mivo/types';
import { DEFAULT_USER_PREFERENCES } from '@mivo/config';

export const chatRouter = Router();

// GET /api/chat/channels - List all channels
chatRouter.get('/channels', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = DatabaseStore.getInstance();
  const user = req.user!;

  const channels: ChatChannel[] = Array.from(db.channels.values()).map((chan) => {
    // Find last message for this channel
    const chanMessages = db.teamMessages.filter((m) => m.channelId === chan.id);
    const lastMsg = chanMessages.length > 0 ? chanMessages[chanMessages.length - 1] : null;

    return {
      ...chan,
      lastMessage: lastMsg,
      unreadCount: 0,
    };
  });

  res.json({
    success: true,
    data: channels,
  });
});

// POST /api/chat/channels - Create a new channel
chatRouter.post('/channels', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = DatabaseStore.getInstance();
  const user = req.user!;
  const validated = CreateChannelSchema.parse(req.body);

  const cleanName = validated.name.toLowerCase().replace(/[^a-z0-9-_]/g, '-');

  // Check if channel name already exists
  for (const chan of db.channels.values()) {
    if (chan.name.toLowerCase() === cleanName) {
      return res.status(409).json({
        success: false,
        error: { code: 'CHANNEL_EXISTS', message: `Channel #${cleanName} already exists` },
      });
    }
  }

  const channelId = `chan_${nanoid(8)}`;
  const newChannel: ChatChannel = {
    id: channelId,
    organizationId: 'org_hyper_lab',
    name: cleanName,
    description: validated.description || '',
    topic: validated.topic || '',
    isPrivate: validated.isPrivate || false,
    memberCount: 1,
    createdAt: new Date().toISOString(),
  };

  db.channels.set(channelId, newChannel);

  // Add system welcome message
  const welcomeMessage: TeamMessage = {
    id: `tmsg_${nanoid(10)}`,
    organizationId: 'org_hyper_lab',
    channelId,
    senderId: user.id,
    senderName: user.name,
    senderAvatar: user.avatarUrl,
    senderRole: user.role === 'org_admin' ? 'Org Admin' : 'Member',
    content: `👋 Welcome to #${cleanName}! Channel created by ${user.name}.`,
    createdAt: new Date().toISOString(),
  };
  db.teamMessages.push(welcomeMessage);

  recordAuditLog(req, 'security.setting_update', 'ChatChannel', channelId, { name: cleanName });

  res.status(201).json({
    success: true,
    data: newChannel,
  });
});

// GET /api/chat/channels/:channelId/messages - Get messages in a channel
chatRouter.get('/channels/:channelId/messages', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { channelId } = req.params;
  const db = DatabaseStore.getInstance();

  if (!db.channels.has(channelId)) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Channel not found' },
    });
  }

  const messages = db.teamMessages.filter((m) => m.channelId === channelId);

  res.json({
    success: true,
    data: messages,
  });
});

// POST /api/chat/channels/:channelId/messages - Send message to channel
chatRouter.post('/channels/:channelId/messages', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { channelId } = req.params;
  const db = DatabaseStore.getInstance();
  const user = req.user!;
  const validated = SendTeamMessageSchema.parse(req.body);

  if (!db.channels.has(channelId)) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Channel not found' },
    });
  }

  const messageId = `tmsg_${nanoid(10)}`;
  const newMessage: TeamMessage = {
    id: messageId,
    organizationId: 'org_hyper_lab',
    channelId,
    senderId: user.id,
    senderName: user.name,
    senderAvatar: user.avatarUrl,
    senderRole: user.role === 'org_admin' ? 'Org Admin' : user.role === 'host' ? 'Host' : 'Member',
    content: validated.content,
    attachments: validated.attachments,
    codeSnippet: validated.codeSnippet,
    meetingInvite: validated.meetingInvite,
    reactions: {},
    createdAt: new Date().toISOString(),
  };

  db.teamMessages.push(newMessage);

  res.status(201).json({
    success: true,
    data: newMessage,
  });
});

// GET /api/chat/direct - List all teammates with online status & last DM
chatRouter.get('/direct', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = DatabaseStore.getInstance();
  const currentUser = req.user!;

  const teammates: TeammatePresence[] = [];

  for (const u of db.users.values()) {
    if (u.id === currentUser.id) continue;

    const presence = db.userPresences.get(u.id) || {
      status: 'offline' as const,
      customStatus: '',
      lastSeen: u.updatedAt,
    };

    // Find last direct message between currentUser and this user
    const directMessages = db.teamMessages.filter(
      (m) =>
        (m.senderId === currentUser.id && m.directRecipientId === u.id) ||
        (m.senderId === u.id && m.directRecipientId === currentUser.id)
    );
    const lastMsg = directMessages.length > 0 ? directMessages[directMessages.length - 1] : null;

    teammates.push({
      userId: u.id,
      name: u.name,
      email: u.email,
      avatarUrl: u.avatarUrl,
      role: u.role === 'org_admin' ? 'Org Admin' : u.role === 'host' ? 'Host / Platform' : 'Engineer',
      status: presence.status as any,
      customStatus: presence.customStatus,
      lastSeen: presence.lastSeen,
      unreadCount: 0,
      lastMessage: lastMsg,
    });
  }

  res.json({
    success: true,
    data: teammates,
  });
});

// POST /api/chat/direct/start - Start direct chat with any person (existing or new)
chatRouter.post('/direct/start', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = DatabaseStore.getInstance();
  const currentUser = req.user!;
  const { email, name, role } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Email is required' } });
  }

  const cleanEmail = email.trim().toLowerCase();

  // Find existing user or create
  let targetUser = Array.from(db.users.values()).find((u) => u.email.toLowerCase() === cleanEmail);

  if (!targetUser) {
    const newUserId = `usr_${nanoid(10)}`;
    const displayName = name || cleanEmail.split('@')[0].replace(/[._-]/g, ' ');

    const createdUser = {
      id: newUserId,
      email: cleanEmail,
      name: displayName,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
      timezone: 'UTC',
      role: 'individual' as const,
      preferences: { ...DEFAULT_USER_PREFERENCES },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      passwordHash: bcrypt.hashSync('Password123!', 10),
    };
    db.users.set(newUserId, createdUser);
    targetUser = createdUser;

    db.userPresences.set(newUserId, {
      status: 'online',
      customStatus: '👋 Just joined the office',
      lastSeen: new Date().toISOString(),
    });
  }

  const presence = db.userPresences.get(targetUser.id) || {
    status: 'online',
    customStatus: '',
    lastSeen: targetUser.updatedAt,
  };

  const teammate: TeammatePresence = {
    userId: targetUser.id,
    name: targetUser.name,
    email: targetUser.email,
    avatarUrl: targetUser.avatarUrl,
    role: targetUser.role === 'org_admin' ? 'Org Admin' : 'Colleague',
    status: presence.status as any,
    customStatus: presence.customStatus,
    lastSeen: presence.lastSeen,
    unreadCount: 0,
    lastMessage: null,
  };

  res.status(201).json({
    success: true,
    data: teammate,
  });
});

// GET /api/chat/direct/:recipientId/messages - Get 1-on-1 direct messages
chatRouter.get('/direct/:recipientId/messages', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { recipientId } = req.params;
  const db = DatabaseStore.getInstance();
  const currentUser = req.user!;

  const messages = db.teamMessages.filter(
    (m) =>
      (m.senderId === currentUser.id && m.directRecipientId === recipientId) ||
      (m.senderId === recipientId && m.directRecipientId === currentUser.id)
  );

  res.json({
    success: true,
    data: messages,
  });
});

// POST /api/chat/direct/:recipientId/messages - Send 1-on-1 direct message
chatRouter.post('/direct/:recipientId/messages', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { recipientId } = req.params;
  const db = DatabaseStore.getInstance();
  const currentUser = req.user!;
  const validated = SendTeamMessageSchema.parse(req.body);

  const recipient = db.users.get(recipientId);
  if (!recipient) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Teammate not found' },
    });
  }

  const messageId = `tmsg_${nanoid(10)}`;
  const newMessage: TeamMessage = {
    id: messageId,
    organizationId: 'org_hyper_lab',
    directRecipientId: recipientId,
    senderId: currentUser.id,
    senderName: currentUser.name,
    senderAvatar: currentUser.avatarUrl,
    senderRole: currentUser.role === 'org_admin' ? 'Org Admin' : currentUser.role === 'host' ? 'Host' : 'Member',
    content: validated.content,
    attachments: validated.attachments,
    codeSnippet: validated.codeSnippet,
    meetingInvite: validated.meetingInvite,
    reactions: {},
    createdAt: new Date().toISOString(),
  };

  db.teamMessages.push(newMessage);

  res.status(201).json({
    success: true,
    data: newMessage,
  });
});

// POST /api/chat/messages/:messageId/reactions - Toggle emoji reaction
chatRouter.post('/messages/:messageId/reactions', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { messageId } = req.params;
  const db = DatabaseStore.getInstance();
  const currentUser = req.user!;
  const validated = ReactMessageSchema.parse(req.body);

  const message = db.teamMessages.find((m) => m.id === messageId);
  if (!message) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Message not found' },
    });
  }

  if (!message.reactions) {
    message.reactions = {};
  }

  const currentReactions = message.reactions[validated.emoji] || [];
  const userIdx = currentReactions.indexOf(currentUser.id);

  if (userIdx >= 0) {
    // Remove reaction
    currentReactions.splice(userIdx, 1);
    if (currentReactions.length === 0) {
      delete message.reactions[validated.emoji];
    } else {
      message.reactions[validated.emoji] = currentReactions;
    }
  } else {
    // Add reaction
    currentReactions.push(currentUser.id);
    message.reactions[validated.emoji] = currentReactions;
  }

  res.json({
    success: true,
    data: message,
  });
});
