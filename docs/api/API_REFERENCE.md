# Mivo Collab — REST & Real-time API Reference

All REST endpoints are prefixed with `/api` and return standardized JSON responses:
```json
{
  "success": true,
  "data": {},
  "error": { "code": "ERROR_CODE", "message": "Human readable message" }
}
```

---

## 1. Authentication Endpoints

### `POST /api/auth/register`
Creates a new individual or organization account.
- **Request Body:** `{ name, email, password, organizationName? }`
- **Response:** `{ user, token, expiresAt }`

### `POST /api/auth/login`
Authenticates existing user with email and password.
- **Request Body:** `{ email, password, rememberMe? }`
- **Response:** `{ user, token, expiresAt }`

### `POST /api/auth/demo-login`
Instant one-click demo persona access for testing.
- **Request Body:** `{ role: "alex" | "sarah" | "liam" }`
- **Response:** `{ user, token, expiresAt }`

### `GET /api/auth/me`
Fetches authenticated user profile, organization memberships, and active plan.
- **Headers:** `Authorization: Bearer <token>`

---

## 2. Meetings Endpoints

### `POST /api/meetings`
Creates an instant meeting session.
- **Request Body:** `{ title, description?, configuration? }`
- **Response:** Meeting object with non-predictable `publicMeetingId` (e.g. `mivo-7x8-9q2-p4k`).

### `POST /api/meetings/schedule`
Schedules a future meeting with date, duration, participant emails, and waiting room settings.
- **Request Body:** `{ title, date, startTime, endTime, participants, recurrence, waitingRoom, muteOnEntry }`

### `GET /api/meetings`
Lists authenticated user's meetings (upcoming, live, and past history).

### `GET /api/meetings/:idOrPublicId`
Retrieves meeting metadata and lobby configuration.

### `POST /api/meetings/:id/end`
Host ends the meeting for all participants and marks duration.

---

## 3. Real-Time Socket.IO Signaling Events

### Client -> Server Events
- `room:join` `{ publicMeetingId, displayName, avatarUrl, initialAudio, initialVideo }`
- `media:state-change` `{ audioEnabled, videoEnabled, screenShareEnabled, handRaised }`
- `media:speaking` `{ isSpeaking, audioLevel }`
- `chat:send` `{ content, recipientId? }`
- `host:mute-participant` `{ targetPeerId }`
- `host:mute-all` `{}`
- `host:remove-participant` `{ targetPeerId, reason? }`
- `host:end-meeting` `{}`
- `host:toggle-lock` `{ locked: boolean }`

### Server -> Client Events
- `room:joined` `{ room, peerId, isHost, existingParticipants }`
- `participant:joined` `PeerMediaState`
- `participant:left` `{ peerId, reason }`
- `participant:updated` `{ peerId, ...updates }`
- `chat:message` `ChatMessage`
- `meeting:ended` `{ reason }`
