import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server, Socket } from 'socket.io';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';
import { APP_CONFIG } from '@mivo/config';
import {
  PeerMediaState,
  ChatMessage,
  ServerToClientEvents,
  ClientToServerEvents,
  Poll,
  PollResponse,
  PollResult,
  CreatePollRequest,
} from '@mivo/types';

dotenv.config();

const app = express();
app.use(cors());

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: '@mivo/signaling',
    version: APP_CONFIG.version,
    activeRooms: roomParticipants.size,
    timestamp: new Date().toISOString(),
  });
});

const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

const PORT = process.env.PORT || APP_CONFIG.defaultPort.signaling;

// Room State: meetingId -> Map<peerId, PeerMediaState>
const roomParticipants = new Map<string, Map<string, PeerMediaState>>();
// Socket to Room & Peer mapping
const socketToPeer = new Map<string, { meetingId: string; peerId: string }>();

// In-Memory Polling State: meetingId -> Map<pollId, Poll>
const roomPolls = new Map<string, Map<string, Poll>>();
// In-Memory Poll Responses: meetingId -> Map<pollId, PollResponse[]>
const roomPollResponses = new Map<string, Map<string, PollResponse[]>>();

function calculateSignalingPollResults(
  poll: Poll,
  responses: PollResponse[],
  isHost: boolean,
  participantCount = 1
): PollResult {
  const totalResponses = responses.length;
  const voteCounts: Record<string, number> = {};
  const voterMap: Record<string, string[]> = {};

  poll.options.forEach((opt) => {
    voteCounts[opt.id] = 0;
    voterMap[opt.id] = [];
  });

  responses.forEach((resp) => {
    resp.selectedOptionIds.forEach((optId) => {
      if (voteCounts[optId] !== undefined) {
        voteCounts[optId]++;
        if (isHost && !poll.isAnonymous) {
          voterMap[optId].push(resp.participantName);
        }
      }
    });
  });

  const options = poll.options.map((opt) => {
    const count = voteCounts[opt.id] || 0;
    const pct = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
    return {
      id: opt.id,
      text: opt.text,
      votesCount: count,
      percentage: pct,
      voterNames: isHost && !poll.isAnonymous ? voterMap[opt.id] : undefined,
    };
  });

  const safeCount = Math.max(participantCount, totalResponses, 1);
  const responseRate = Math.min(100, Math.round((totalResponses / safeCount) * 100));

  return {
    poll: { ...poll, totalResponses },
    totalResponses,
    participantCount: safeCount,
    responseRate,
    options,
    responses: isHost && !poll.isAnonymous ? responses : undefined,
  };
}

io.on('connection', (socket: Socket) => {
  const socketId = socket.id;
  console.log(`🔌 [Signaling] New socket connected: ${socketId}`);

  // 1. Join Room
  socket.on('room:join', (payload) => {
    const { publicMeetingId, displayName, avatarUrl, userId, initialAudio, initialVideo } = payload;
    const peerId = `peer_${nanoid(8)}`;

    socket.join(publicMeetingId);

    if (!roomParticipants.has(publicMeetingId)) {
      roomParticipants.set(publicMeetingId, new Map());
    }

    const roomMap = roomParticipants.get(publicMeetingId)!;
    const isFirstParticipant = roomMap.size === 0;

    const newPeer: PeerMediaState = {
      peerId,
      userId: userId || undefined,
      displayName: displayName || 'Anonymous Collab',
      avatarUrl: avatarUrl || undefined,
      role: isFirstParticipant ? 'host' : 'participant',
      audioEnabled: initialAudio ?? true,
      videoEnabled: initialVideo ?? true,
      screenShareEnabled: false,
      handRaised: false,
      isSpeaking: false,
      audioLevel: 0,
      connectionQuality: 'connected',
    };

    const existingParticipants = Array.from(roomMap.values());
    roomMap.set(peerId, newPeer);
    socketToPeer.set(socketId, { meetingId: publicMeetingId, peerId });

    // Send confirmation to the joining peer with existing participants list
    socket.emit('room:joined', {
      room: {
        id: `mtg_${publicMeetingId}`,
        publicMeetingId,
        title: 'Mivo Collab Room',
        hostId: isFirstParticipant ? userId || peerId : 'host_id',
        hostName: isFirstParticipant ? displayName : 'Meeting Host',
        type: 'instant',
        status: 'live',
        configuration: {
          waitingRoom: false,
          allowScreenShare: true,
          allowChat: true,
          muteOnEntry: false,
          videoOnEntry: true,
          requireAuth: false,
          recordingEnabled: false,
          aiTranscription: true,
        },
        participantCount: roomMap.size,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      peerId,
      isHost: isFirstParticipant,
      existingParticipants,
    });

    // Notify other participants in the room
    socket.to(publicMeetingId).emit('participant:joined', newPeer);

    console.log(`✅ [Signaling] Peer ${displayName} (${peerId}) joined room ${publicMeetingId}. Room size: ${roomMap.size}`);
  });

  // 2. WebRTC SDP Offer Relay
  socket.on('signal:offer', ({ targetPeerId, sdp }) => {
    const current = socketToPeer.get(socketId);
    if (!current) return;
    socket.to(current.meetingId).emit('signal:offer', {
      senderPeerId: current.peerId,
      targetPeerId,
      sdp,
    });
  });

  // 3. WebRTC SDP Answer Relay
  socket.on('signal:answer', ({ targetPeerId, sdp }) => {
    const current = socketToPeer.get(socketId);
    if (!current) return;
    socket.to(current.meetingId).emit('signal:answer', {
      senderPeerId: current.peerId,
      targetPeerId,
      sdp,
    });
  });

  // 4. WebRTC ICE Candidate Relay
  socket.on('signal:ice-candidate', ({ targetPeerId, candidate }) => {
    const current = socketToPeer.get(socketId);
    if (!current) return;
    socket.to(current.meetingId).emit('signal:ice-candidate', {
      senderPeerId: current.peerId,
      targetPeerId,
      candidate,
    });
  });

  // 5. Media State Change (Mute, Camera, Screen Share, Hand Raise)
  socket.on('media:state-change', (updates) => {
    const current = socketToPeer.get(socketId);
    if (!current) return;

    const roomMap = roomParticipants.get(current.meetingId);
    if (roomMap && roomMap.has(current.peerId)) {
      const peer = roomMap.get(current.peerId)!;
      Object.assign(peer, updates);

      if (updates.screenShareEnabled !== undefined) {
        if (updates.screenShareEnabled) {
          io.to(current.meetingId).emit('screen:started', {
            peerId: current.peerId,
            displayName: peer.displayName,
          });
        } else {
          io.to(current.meetingId).emit('screen:stopped', {
            peerId: current.peerId,
          });
        }
      }

      io.to(current.meetingId).emit('participant:updated', {
        ...updates,
        peerId: current.peerId,
      });
    }
  });

  // 6. Voice Activity & Audio Level
  socket.on('media:speaking', ({ isSpeaking, audioLevel }) => {
    const current = socketToPeer.get(socketId);
    if (!current) return;

    const roomMap = roomParticipants.get(current.meetingId);
    if (roomMap && roomMap.has(current.peerId)) {
      const peer = roomMap.get(current.peerId)!;
      peer.isSpeaking = isSpeaking;
      peer.audioLevel = audioLevel;

      socket.to(current.meetingId).emit('participant:updated', {
        peerId: current.peerId,
        isSpeaking,
        audioLevel,
      });
    }
  });

  // 7. Chat Message Broadcast (Everyone vs Host vs Direct)
  socket.on('chat:send', ({ content, recipientId }) => {
    const current = socketToPeer.get(socketId);
    if (!current) return;

    const roomMap = roomParticipants.get(current.meetingId);
    const senderPeer = roomMap ? roomMap.get(current.peerId) : undefined;

    const message: ChatMessage = {
      id: `msg_${nanoid(10)}`,
      meetingId: current.meetingId,
      senderId: current.peerId,
      senderName: senderPeer ? senderPeer.displayName : 'Participant',
      senderAvatar: senderPeer ? senderPeer.avatarUrl : null,
      content,
      recipientId: recipientId || null,
      recipientName: recipientId === 'host' ? 'Host' : recipientId ? 'Private' : 'Everyone',
      isPrivate: Boolean(recipientId && recipientId !== 'everyone'),
      createdAt: new Date().toISOString(),
    };

    if (!recipientId || recipientId === 'everyone') {
      io.to(current.meetingId).emit('chat:message', message);
    } else if (recipientId === 'host') {
      // Send to Host(s) and sender
      for (const [sId, mapping] of socketToPeer.entries()) {
        if (mapping.meetingId === current.meetingId) {
          const peer = roomMap?.get(mapping.peerId);
          if (peer?.role === 'host' || mapping.peerId === current.peerId) {
            io.to(sId).emit('chat:message', message);
          }
        }
      }
    } else {
      // Send to specific target peer and sender
      for (const [sId, mapping] of socketToPeer.entries()) {
        if (mapping.meetingId === current.meetingId) {
          if (mapping.peerId === recipientId || mapping.peerId === current.peerId) {
            io.to(sId).emit('chat:message', message);
          }
        }
      }
    }
  });

  // 8. Host Moderation Controls
  socket.on('host:mute-participant', ({ targetPeerId }) => {
    const current = socketToPeer.get(socketId);
    if (!current) return;
    io.to(current.meetingId).emit('participant:updated', {
      peerId: targetPeerId,
      audioEnabled: false,
    });
    io.to(current.meetingId).emit('host:action', {
      action: 'muted',
      initiatedBy: current.peerId,
      message: 'Participant was muted by host.',
    });
  });

  socket.on('host:mute-all', () => {
    const current = socketToPeer.get(socketId);
    if (!current) return;
    const roomMap = roomParticipants.get(current.meetingId);
    if (roomMap) {
      for (const [pId, peer] of roomMap.entries()) {
        if (pId !== current.peerId) {
          peer.audioEnabled = false;
          io.to(current.meetingId).emit('participant:updated', {
            peerId: pId,
            audioEnabled: false,
          });
        }
      }
    }
    io.to(current.meetingId).emit('host:action', {
      action: 'muted',
      initiatedBy: current.peerId,
      message: 'All participants were muted by host.',
    });
  });

  socket.on('host:remove-participant', ({ targetPeerId, reason }) => {
    const current = socketToPeer.get(socketId);
    if (!current) return;
    io.to(current.meetingId).emit('participant:left', {
      peerId: targetPeerId,
      reason: reason || 'Removed by host',
    });
  });

  socket.on('host:end-meeting', () => {
    const current = socketToPeer.get(socketId);
    if (!current) return;
    io.to(current.meetingId).emit('meeting:ended', {
      reason: 'The host has ended this meeting for everyone.',
    });
    roomParticipants.delete(current.meetingId);
  });

  // 9. Team & Office Chat Events
  socket.on('chat:user-join', ({ userId }: { userId: string }) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`💬 [Signaling] User ${userId} joined personal messaging channel`);
    }
  });

  socket.on('chat:channel-join', ({ channelId }: { channelId: string }) => {
    if (channelId) {
      socket.join(`chan_${channelId}`);
      console.log(`💬 [Signaling] Socket ${socketId} joined channel chan_${channelId}`);
    }
  });

  socket.on('chat:channel-leave', ({ channelId }: { channelId: string }) => {
    if (channelId) {
      socket.leave(`chan_${channelId}`);
    }
  });

  socket.on('chat:channel-message', ({ channelId, message }: any) => {
    io.to(`chan_${channelId}`).emit('chat:channel-message' as any, { channelId, message });
  });

  socket.on('chat:direct-message', ({ recipientId, message }: any) => {
    // Deliver to recipient room and echo to sender
    io.to(`user_${recipientId}`).emit('chat:direct-message' as any, { recipientId, message });
    if (message.senderId) {
      io.to(`user_${message.senderId}`).emit('chat:direct-message' as any, { recipientId, message });
    }
  });

  socket.on('chat:typing', ({ targetType, targetId, userName, isTyping }: any) => {
    if (targetType === 'channel') {
      socket.to(`chan_${targetId}`).emit('chat:typing' as any, { targetType, targetId, userName, isTyping });
    } else {
      socket.to(`user_${targetId}`).emit('chat:typing' as any, { targetType, targetId, userName, isTyping });
    }
  });

  socket.on('chat:reaction', ({ targetId, messageId, emoji, userId, reactions }: any) => {
    io.emit('chat:reaction' as any, { targetId, messageId, emoji, userId, reactions });
  });

  // 10. Polling Real-Time Events
  socket.on('poll:create', ({ meetingId, poll }: { meetingId: string; poll: any }) => {
    const current = socketToPeer.get(socketId);
    const mid = meetingId || current?.meetingId;
    if (!mid) return;

    const roomMap = roomParticipants.get(mid);
    const peer = current ? roomMap?.get(current.peerId) : undefined;

    let targetPoll: Poll;
    if (poll && poll.id && Array.isArray(poll.options) && typeof poll.options[0] === 'object') {
      // Pre-created Poll object from REST API with authoritative ID & options
      targetPoll = poll as Poll;
    } else {
      const pollId = `poll_${nanoid(10)}`;
      targetPoll = {
        id: pollId,
        meetingId: mid,
        hostId: peer?.userId || peer?.peerId || 'host_id',
        hostName: peer?.displayName || 'Meeting Host',
        question: poll.question,
        options: Array.isArray(poll.options)
          ? poll.options.map((opt: string) => ({ id: `opt_${nanoid(6)}`, text: typeof opt === 'string' ? opt : (opt as any).text }))
          : [],
        pollType: poll.pollType || 'single',
        isAnonymous: Boolean(poll.isAnonymous),
        allowResponseChange: poll.allowResponseChange !== undefined ? poll.allowResponseChange : true,
        showResultsToParticipants: Boolean(poll.showResultsToParticipants),
        status: poll.status || 'draft',
        createdAt: poll.createdAt || new Date().toISOString(),
        startedAt: poll.startedAt || null,
        closedAt: poll.closedAt || null,
      };
    }

    if (!roomPolls.has(mid)) {
      roomPolls.set(mid, new Map());
    }
    roomPolls.get(mid)!.set(targetPoll.id, targetPoll);

    if (!roomPollResponses.has(mid)) {
      roomPollResponses.set(mid, new Map());
    }
    if (!roomPollResponses.get(mid)!.has(targetPoll.id)) {
      roomPollResponses.get(mid)!.set(targetPoll.id, []);
    }

    // Broadcast creation to all in room
    io.to(mid).emit('poll:created', { poll: targetPoll });
    console.log(`📊 [Signaling] Poll created in ${mid}: "${targetPoll.question}" (ID: ${targetPoll.id})`);
  });

  socket.on('poll:start', ({ meetingId, pollId, poll }: { meetingId: string; pollId: string; poll?: Poll }) => {
    const current = socketToPeer.get(socketId);
    const mid = meetingId || current?.meetingId;
    if (!mid || !pollId) return;

    if (!roomPolls.has(mid)) {
      roomPolls.set(mid, new Map());
    }
    const pollsMap = roomPolls.get(mid)!;
    let targetPoll = pollsMap.get(pollId);

    if (!targetPoll && poll) {
      targetPoll = { ...poll };
      pollsMap.set(pollId, targetPoll);
    }

    if (!targetPoll) {
      console.warn(`[Signaling] poll:start - Poll ${pollId} not found in room ${mid}`);
      return;
    }

    targetPoll.status = 'active';
    targetPoll.startedAt = targetPoll.startedAt || new Date().toISOString();
    targetPoll.closedAt = null;

    if (!roomPollResponses.has(mid)) {
      roomPollResponses.set(mid, new Map());
    }
    if (!roomPollResponses.get(mid)!.has(pollId)) {
      roomPollResponses.get(mid)!.set(pollId, []);
    }

    // Broadcast to everyone in room: poll has started!
    io.to(mid).emit('poll:started', { poll: targetPoll });
    console.log(`🚀 [Signaling] Poll started in ${mid}: "${targetPoll.question}" (ID: ${pollId})`);
  });

  socket.on('poll:respond', ({ meetingId, pollId, selectedOptionIds }) => {
    const current = socketToPeer.get(socketId);
    const mid = meetingId || current?.meetingId;
    if (!mid || !pollId) return;

    const roomMap = roomParticipants.get(mid);
    const senderPeer = current ? roomMap?.get(current.peerId) : undefined;
    const participantId = current ? current.peerId : `peer_${nanoid(6)}`;
    const participantName = senderPeer ? senderPeer.displayName : 'Participant';

    const pollsMap = roomPolls.get(mid);
    const poll = pollsMap?.get(pollId);
    if (poll && poll.status !== 'active') return;

    if (!roomPollResponses.has(mid)) {
      roomPollResponses.set(mid, new Map());
    }
    const responsesMap = roomPollResponses.get(mid)!;
    let responses = responsesMap.get(pollId) || [];

    const existingIdx = responses.findIndex((r) => r.participantId === participantId);
    if (existingIdx >= 0) {
      if (poll && !poll.allowResponseChange) return;
      responses[existingIdx].selectedOptionIds = selectedOptionIds;
      responses[existingIdx].updatedAt = new Date().toISOString();
    } else {
      responses.push({
        id: `resp_${nanoid(10)}`,
        pollId,
        meetingId: mid,
        participantId,
        participantName,
        selectedOptionIds,
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    responsesMap.set(pollId, responses);

    if (poll) {
      const participantCount = roomMap ? roomMap.size : 1;
      const hostResults = calculateSignalingPollResults(poll, responses, true, participantCount);
      const participantResults = calculateSignalingPollResults(poll, responses, false, participantCount);

      // Send updated results to all clients
      for (const [sId, mapping] of socketToPeer.entries()) {
        if (mapping.meetingId === mid) {
          const targetPeer = roomMap?.get(mapping.peerId);
          if (targetPeer?.role === 'host') {
            io.to(sId).emit('poll:response-received', { pollId, results: hostResults });
          } else if (poll.showResultsToParticipants) {
            io.to(sId).emit('poll:response-received', { pollId, results: participantResults });
          }
        }
      }
    }
  });

  socket.on('poll:close', ({ meetingId, pollId }) => {
    const current = socketToPeer.get(socketId);
    const mid = meetingId || current?.meetingId;
    if (!mid || !pollId) return;

    const roomMap = roomParticipants.get(mid);
    const pollsMap = roomPolls.get(mid);
    const poll = pollsMap?.get(pollId);
    if (!poll) return;

    poll.status = 'closed';
    poll.closedAt = new Date().toISOString();

    const responses = roomPollResponses.get(mid)?.get(pollId) || [];
    const participantCount = roomMap ? roomMap.size : 1;
    const hostResults = calculateSignalingPollResults(poll, responses, true, participantCount);
    const participantResults = calculateSignalingPollResults(poll, responses, false, participantCount);

    for (const [sId, mapping] of socketToPeer.entries()) {
      if (mapping.meetingId === mid) {
        const targetPeer = roomMap?.get(mapping.peerId);
        const results = targetPeer?.role === 'host' ? hostResults : poll.showResultsToParticipants ? participantResults : undefined;
        io.to(sId).emit('poll:closed', { pollId, results });
      }
    }
    console.log(`🔒 [Signaling] Poll closed in ${mid}: "${poll.question}"`);
  });

  socket.on('poll:reopen', ({ meetingId, pollId }) => {
    const current = socketToPeer.get(socketId);
    const mid = meetingId || current?.meetingId;
    if (!mid || !pollId) return;

    const pollsMap = roomPolls.get(mid);
    const poll = pollsMap?.get(pollId);
    if (!poll) return;

    poll.status = 'active';
    poll.closedAt = null;

    io.to(mid).emit('poll:reopened', { poll });
  });

  socket.on('poll:delete', ({ meetingId, pollId }) => {
    const current = socketToPeer.get(socketId);
    const mid = meetingId || current?.meetingId;
    if (!mid || !pollId) return;

    roomPolls.get(mid)?.delete(pollId);
    roomPollResponses.get(mid)?.delete(pollId);

    io.to(mid).emit('poll:deleted', { pollId });
  });

  socket.on('poll:toggle-results-visibility', ({ meetingId, pollId, showResultsToParticipants }) => {
    const current = socketToPeer.get(socketId);
    const mid = meetingId || current?.meetingId;
    if (!mid || !pollId) return;

    const roomMap = roomParticipants.get(mid);
    const pollsMap = roomPolls.get(mid);
    const poll = pollsMap?.get(pollId);
    if (!poll) return;

    poll.showResultsToParticipants = Boolean(showResultsToParticipants);

    const responses = roomPollResponses.get(mid)?.get(pollId) || [];
    const participantCount = roomMap ? roomMap.size : 1;
    const participantResults = calculateSignalingPollResults(poll, responses, false, participantCount);

    io.to(mid).emit('poll:results-visibility-changed', {
      pollId,
      showResultsToParticipants: poll.showResultsToParticipants,
      results: poll.showResultsToParticipants ? participantResults : undefined,
    });
  });

  // 11. Disconnect & Cleanup
  const handleLeave = () => {
    const current = socketToPeer.get(socketId);
    if (current) {
      const { meetingId, peerId } = current;
      const roomMap = roomParticipants.get(meetingId);
      if (roomMap) {
        roomMap.delete(peerId);
        socket.to(meetingId).emit('participant:left', { peerId, reason: 'Left meeting' });
        console.log(`👋 [Signaling] Peer ${peerId} left room ${meetingId}. Remaining: ${roomMap.size}`);
        if (roomMap.size === 0) {
          roomParticipants.delete(meetingId);
        }
      }
      socketToPeer.delete(socketId);
    }
  };

  socket.on('room:leave', handleLeave);
  socket.on('disconnect', handleLeave);
});

server.listen(PORT, () => {
  console.log(`📡 [Mivo Collab Signaling] WebSocket & RTC server listening on http://localhost:${PORT}`);
});
