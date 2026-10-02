# Mivo Collab

<p align="center">
  <img src="./logo.png" alt="Mivo Collab" width="160" style="boder-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);" />
</p>

<h3 align="center"><strong>Connect • Collaborate • Grow</strong></h3>

<p align="center">
  A production-oriented real-time video communication & collaboration SaaS platform engineered by <strong>HyperDevelopers</strong>.
</p>

---

## 🌟 Key Capabilities

- 🎥 **HD WebRTC & SFU Media Routing:** Selective Forwarding Unit architecture with adaptive bitrate, simulcast, and low-latency audio/video.
- ⚡ **Instant & Scheduled Meetings:** Generate cryptographically secure meeting rooms (`/join/mivo-xxx-yyy-zzz`) in milliseconds.
- 🎛️ **Pre-Join Device Lobby:** Live camera test, mic volume visualizer, hardware switcher, and permission failure fallbacks.
- 🖥️ **Presentation Screen Sharing:** 60fps HD screen sharing with active speaker spotlight mode.
- 💬 **In-Call Real-Time Chat:** Ephemeral and persisted chat with emoji reactions and direct messaging.
- 🛡️ **Host Moderation Suite:** Mute individual or all participants, remove users, toggle room locks, and end meeting for all.
- 🏢 **Multi-Tenant SaaS Organizations:** Team management, member roles (Owner, Admin, Member, Guest), audit trail ledger.
- 💳 **Configurable Billing State Machine:** SaaS tiers (Free, Pro, Business, Enterprise) with Stripe/Razorpay webhook idempotency.
- 🤖 **AI Meeting Intelligence:** Architecture for automated transcription, action item summaries, and knowledge search.

---

## 🏗️ Architecture & Monorepo Layout

```
mivo-collab/
├── apps/
│   ├── web/           # Next.js App Router frontend, Tailwind CSS, WebRTC engine
│   ├── api/           # Express/Fastify REST API, JWT auth, PostgreSQL repository
│   ├── signaling/     # Socket.IO WebRTC signaling & room presence gateway
│   └── worker/        # BullMQ / Redis background worker for async tasks
├── packages/
│   ├── types/         # Domain TypeScript models, RTC contracts, API DTOs
│   ├── validation/    # Shared Zod validation schemas
│   ├── config/        # Centralized configurations & billing tiers
│   └── ui/            # Shared UI tokens & design primitives
├── infrastructure/
│   ├── database/      # schema.sql PostgreSQL relational schema
│   └── docker/        # Docker Compose and multi-stage Dockerfiles
├── docs/              # Comprehensive Architecture, Security, and API docs
└── tests/             # Automated test suite
```

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy the example environment file:
```bash
cp .env.example .env
```

### 3. Run Microservices
Run the full monorepo development stack (Web frontend, REST API, Signaling gateway, Worker):
```bash
# Terminal 1: Run all services concurrently
npm run dev

# Or run individual services:
npm run dev:web        # Next.js on http://localhost:3000
npm run dev:api        # REST API on http://localhost:4000
npm run dev:signaling  # WebRTC Signaling on http://localhost:4001
npm run dev:worker     # Background Worker
```

### 4. Open in Browser
- **Web App & Dashboard:** [http://localhost:3000](http://localhost:3000)
- **API Health Check:** [http://localhost:4000/health](http://localhost:4000/health)
- **Signaling Server Health:** [http://localhost:4001/health](http://localhost:4001/health)

---

## 🧪 Demo User Accounts

You can test immediately with one-click persona login:

| Persona | Email | Role | Default Password |
| :--- | :--- | :--- | :--- |
| **Alex Rivera** | `alex@mivo.collab` | Individual Host | `Password123!` |
| **Sarah Chen** | `sarah@hyperdevs.io` | Org Admin | `Password123!` |
| **Liam Smith** | `liam@hyperdevs.io` | Member / Engineer | `Password123!` |

---

## 🐳 Docker Deployment

To spin up the full production cluster (PostgreSQL, Redis, API, Signaling, Worker, Web):

```bash
cd infrastructure/docker
docker-compose up --build -d
```

---

## 🛡️ Security & DTLS-SRTP Compliance

- **End-to-End Media Encryption:** DTLS-SRTP on all media streams.
- **Server-Side Authorization:** Every host moderation, member invite, or billing update is strictly validated on backend APIs.
- **Audit Logs:** Real-time immutable ledger in `audit_logs` tracking IP, user-agent, actor, and target.

---

## 📄 License & Attribution

Mivo Collab is designed, owned, and developed by **HyperDevelopers**.
All rights reserved.
