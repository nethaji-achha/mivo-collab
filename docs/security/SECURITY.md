# Mivo Collab — Security, Privacy & Compliance Architecture

Mivo Collab implements a **defense-in-depth, zero-trust** security architecture designed to meet enterprise compliance standards (SOC 2 Type II, GDPR, HIPAA ready).

---

## 1. Core Security Guarantees

1. **Server-Side Authorization Always:**
   - Client permissions are never trusted for state-changing operations.
   - Host moderation actions (mute, kick, lock room, end meeting) are verified on the API and WebSocket gateways.

2. **Non-Predictable Meeting Identifiers:**
   - Public meeting IDs use cryptographically secure random identifiers (e.g. `mivo-3x9-7kp-2wa`) to prevent meeting enumeration or unauthorized intrusions.
   - Internal auto-increment database keys are never exposed in public routes.

3. **Media Stream Encryption:**
   - WebRTC media channels (audio, video, data) are encrypted with **DTLS 1.2+** and **SRTP (AES-GCM)**.
   - Direct peer-to-peer or SFU relay paths cannot be eavesdropped in transit.

4. **Credential & Secret Protection:**
   - Passwords are salted and hashed with **bcrypt (10 rounds)**.
   - JSON Web Tokens (JWT) are signed with high-entropy keys and validated on every request.
   - Session cookies utilize `HttpOnly`, `SameSite=Lax`, and `Secure` flags.

5. **Immutable Audit Ledger:**
   - Every login, meeting creation, member invitation, role change, and subscription event is logged to the `audit_logs` table with actor metadata, IP address, user-agent, and JSON change payload.

6. **Rate Limiting & Abuse Prevention:**
   - Sensitive endpoints (`/api/auth/*`, `/api/meetings/*`) are protected by IP and session rate limiters.
