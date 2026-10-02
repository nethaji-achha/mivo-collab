import { Router, Response } from 'express';
import { nanoid, customAlphabet } from 'nanoid';
import { DatabaseStore } from '../db';
import { CreateMeetingSchema, ScheduleMeetingSchema, SendMessageSchema } from '@mivo/validation';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { recordAuditLog } from '../middleware/audit.middleware';
import { DEFAULT_MEETING_CONFIG } from '@mivo/config';
import { Meeting, ChatMessage } from '@mivo/types';

// Generate human-friendly non-predictable meeting slug e.g. "mivo-7x8-9q2-p4k"
const generateMeetingSlug = customAlphabet('abcdefghjkmnpqrstuvwxyz23456789', 3);

export function createSecureMeetingId(): string {
  return `mivo-${generateMeetingSlug()}-${generateMeetingSlug()}-${generateMeetingSlug()}`;
}

export const meetingsRouter = Router();

// GET /api/meetings (List meetings for authenticated user)
meetingsRouter.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = DatabaseStore.getInstance();
  const userId = req.user!.id;

  const userMeetings: Meeting[] = [];
  for (const meeting of db.meetings.values()) {
    if (meeting.hostId === userId || meeting.type === 'persistent_room') {
      userMeetings.push(meeting);
    }
  }

  // Sort by created / scheduled time desc
  userMeetings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    data: userMeetings,
  });
});

// POST /api/meetings (Create instant or scheduled meeting)
meetingsRouter.post('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const db = DatabaseStore.getInstance();
  const validated = CreateMeetingSchema.parse(req.body);

  const publicMeetingId = createSecureMeetingId();
  const meetingId = `mtg_${nanoid(12)}`;

  const newMeeting: Meeting = {
    id: meetingId,
    publicMeetingId,
    title: validated.title || `${user.name}'s Meeting`,
    description: validated.description,
    hostId: user.id,
    hostName: user.name,
    hostAvatar: user.avatarUrl,
    type: validated.type || 'instant',
    status: validated.type === 'scheduled' ? 'scheduled' : 'live',
    scheduledStartTime: validated.scheduledStartTime || null,
    scheduledEndTime: validated.scheduledEndTime || null,
    actualStartTime: validated.type === 'instant' ? new Date().toISOString() : null,
    configuration: {
      ...DEFAULT_MEETING_CONFIG,
      ...(validated.configuration || {}),
    },
    participantCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.meetings.set(newMeeting.id, newMeeting);
  db.messages.set(newMeeting.id, []);

  recordAuditLog(req, 'meeting.create', 'Meeting', newMeeting.id, {
    publicMeetingId: newMeeting.publicMeetingId,
    title: newMeeting.title,
    type: newMeeting.type,
  });

  res.status(201).json({
    success: true,
    data: newMeeting,
  });
});

// POST /api/meetings/schedule
meetingsRouter.post('/schedule', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const db = DatabaseStore.getInstance();
  const validated = ScheduleMeetingSchema.parse(req.body);

  const publicMeetingId = createSecureMeetingId();
  const meetingId = `mtg_${nanoid(12)}`;

  const scheduledStart = new Date(`${validated.date}T${validated.startTime}:00`).toISOString();
  const scheduledEnd = new Date(`${validated.date}T${validated.endTime}:00`).toISOString();

  const newMeeting: Meeting = {
    id: meetingId,
    publicMeetingId,
    title: validated.title,
    description: validated.description,
    hostId: user.id,
    hostName: user.name,
    hostAvatar: user.avatarUrl,
    type: 'scheduled',
    status: 'scheduled',
    scheduledStartTime: scheduledStart,
    scheduledEndTime: scheduledEnd,
    configuration: {
      ...DEFAULT_MEETING_CONFIG,
      waitingRoom: validated.waitingRoom,
      muteOnEntry: validated.muteOnEntry,
      recordingEnabled: validated.recordingEnabled,
    },
    participantCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.meetings.set(newMeeting.id, newMeeting);
  db.messages.set(newMeeting.id, []);

  // If participants invited, create notification
  if (validated.participants && validated.participants.length > 0) {
    for (const email of validated.participants) {
      // Find if registered user
      for (const u of db.users.values()) {
        if (u.email.toLowerCase() === email.toLowerCase()) {
          const notifs = db.notifications.get(u.id) || [];
          notifs.unshift({
            id: `notif_${nanoid(10)}`,
            userId: u.id,
            type: 'meeting_invite',
            title: `Meeting Invitation: ${newMeeting.title}`,
            message: `${user.name} invited you to a meeting scheduled for ${validated.date} at ${validated.startTime}.`,
            data: { meetingId: newMeeting.publicMeetingId, scheduledStart },
            read: false,
            createdAt: new Date().toISOString(),
          });
          db.notifications.set(u.id, notifs);
        }
      }
    }
  }

  recordAuditLog(req, 'meeting.create', 'Meeting', newMeeting.id, {
    publicMeetingId: newMeeting.publicMeetingId,
    title: newMeeting.title,
    type: 'scheduled',
  });

  res.status(201).json({
    success: true,
    data: newMeeting,
  });
});

// GET /api/meetings/:idOrPublicId (Get meeting details by DB id or public meeting slug)
meetingsRouter.get('/:idOrPublicId', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { idOrPublicId } = req.params;
  const db = DatabaseStore.getInstance();

  let foundMeeting: Meeting | undefined;
  for (const m of db.meetings.values()) {
    if (m.id === idOrPublicId || m.publicMeetingId.toLowerCase() === idOrPublicId.toLowerCase()) {
      foundMeeting = m;
      break;
    }
  }

  // If not found and starts with "mivo-", create on-the-fly for ad-hoc meeting link joining
  if (!foundMeeting && idOrPublicId.startsWith('mivo-')) {
    const meetingId = `mtg_${nanoid(12)}`;
    foundMeeting = {
      id: meetingId,
      publicMeetingId: idOrPublicId,
      title: 'Mivo Collab Room',
      hostId: req.user ? req.user.id : 'host_ad_hoc',
      hostName: req.user ? req.user.name : 'Host',
      type: 'instant',
      status: 'live',
      actualStartTime: new Date().toISOString(),
      configuration: { ...DEFAULT_MEETING_CONFIG },
      participantCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.meetings.set(meetingId, foundMeeting);
    db.messages.set(meetingId, []);
  }

  if (!foundMeeting) {
    return res.status(404).json({
      success: false,
      error: { code: 'MEETING_NOT_FOUND', message: 'The requested meeting does not exist or has expired' },
    });
  }

  const isHost = req.user ? req.user.id === foundMeeting.hostId : false;

  res.json({
    success: true,
    data: {
      ...foundMeeting,
      isHost,
    },
  });
});

// POST /api/meetings/:id/end (Host ends meeting)
meetingsRouter.post('/:id/end', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = DatabaseStore.getInstance();
  const user = req.user!;

  let meeting: Meeting | undefined;
  for (const m of db.meetings.values()) {
    if (m.id === id || m.publicMeetingId === id) {
      meeting = m;
      break;
    }
  }

  if (!meeting) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Meeting not found' } });
  }

  if (meeting.hostId !== user.id && user.role !== 'org_admin' && user.role !== 'enterprise_admin') {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only the host can end this meeting' } });
  }

  meeting.status = 'ended';
  meeting.actualEndTime = new Date().toISOString();
  meeting.durationSeconds = meeting.actualStartTime
    ? Math.floor((new Date().getTime() - new Date(meeting.actualStartTime).getTime()) / 1000)
    : 1800;
  meeting.updatedAt = new Date().toISOString();

  recordAuditLog(req, 'meeting.end', 'Meeting', meeting.id, { durationSeconds: meeting.durationSeconds });

  res.json({
    success: true,
    data: meeting,
  });
});

// GET /api/meetings/:id/messages
meetingsRouter.get('/:id/messages', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = DatabaseStore.getInstance();

  let targetMeetingId = id;
  for (const m of db.meetings.values()) {
    if (m.publicMeetingId === id) {
      targetMeetingId = m.id;
      break;
    }
  }

  const messages = db.messages.get(targetMeetingId) || [];
  res.json({
    success: true,
    data: messages,
  });
});

// POST /api/meetings/:id/messages
meetingsRouter.post('/:id/messages', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = DatabaseStore.getInstance();
  const validated = SendMessageSchema.parse({ ...req.body, meetingId: id });

  let targetMeetingId = id;
  for (const m of db.meetings.values()) {
    if (m.publicMeetingId === id) {
      targetMeetingId = m.id;
      break;
    }
  }

  const senderName = req.user ? req.user.name : (req.body.senderName || 'Participant');
  const senderId = req.user ? req.user.id : (req.body.senderId || `guest_${nanoid(6)}`);
  const senderAvatar = req.user ? req.user.avatarUrl : null;

  const msg: ChatMessage = {
    id: `msg_${nanoid(10)}`,
    meetingId: targetMeetingId,
    senderId,
    senderName,
    senderAvatar,
    content: validated.content,
    recipientId: validated.recipientId || null,
    createdAt: new Date().toISOString(),
  };

  const msgs = db.messages.get(targetMeetingId) || [];
  msgs.push(msg);
  db.messages.set(targetMeetingId, msgs);

  res.status(201).json({
    success: true,
    data: msg,
  });
});
