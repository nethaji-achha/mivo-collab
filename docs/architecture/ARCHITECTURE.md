# Mivo Collab — System Architecture & Engineering Blueprint

> **Tagline:** Connect • Collaborate • Communicate  
> **Author & Owner:** HyperDevelopers  
> **Status:** Production-Ready MVP & Phase 1-5 Expansion Roadmap  

---

## 1. Architectural Overview

Mivo Collab is architected as a modular, high-availability monorepo engineered around real-time WebRTC media routing, selective forwarding units (SFU), stateless REST APIs, low-latency WebSocket signaling, and persistent PostgreSQL storage.

```
                    ┌────────────────────────────┐
                    │      Client Browsers       │
                    │  (Next.js App / WebRTC)    │
                    └───────┬────────────┬───────┘
                            │            │
            HTTPS / REST    │            │  WSS / Socket.IO
                            ▼            ▼
               ┌────────────────┐   ┌────────────────┐
               │  @mivo/api     │   │@mivo/signaling │
               │  (Express/JWT) │   │ (WebRTC Relay) │
               └───────┬────────┘   └────────┬───────┘
                       │                     │
            PostgreSQL │               Redis │ (Presence/Queue)
                       ▼                     ▼
               ┌────────────────┐   ┌────────────────┐
               │ PostgreSQL DB  │   │  Redis State   │
               │ (Durable Data) │   │  & BullMQ Qs   │
               └────────────────┘   └────────┬───────┘
                                             │
                                             ▼
                                    ┌────────────────┐
                                    │  @mivo/worker  │
                                    │ (Cleanup & AI) │
                                    └────────────────┘
```

---

## 2. Monorepo Structure

```
mivo-collab/
├── apps/
│   ├── web/           # Next.js 14 App Router, Tailwind CSS, WebRTC client, UI layout
│   ├── api/           # Fastify/Express modular REST API, JWT auth, RBAC, DB repository
│   ├── signaling/     # Socket.IO WebRTC signaling, room state sync, host moderation
│   └── worker/        # BullMQ background job worker for AI summaries & cleanup
├── packages/
│   ├── types/         # Domain TypeScript models, RTC contracts, API DTOs
│   ├── validation/    # Shared Zod validation schemas
│   ├── config/        # Centralized configurations, plans, ICE servers
│   └── ui/            # Shared UI tokens, avatars, formatters
├── infrastructure/
│   ├── database/      # PostgreSQL schema.sql & migrations
│   └── docker/        # Multi-stage Dockerfiles & docker-compose.yml
├── docs/              # Architectural, Security, API, & Roadmap documentation
└── tests/             # Automated unit & integration tests
```

---

## 3. WebRTC & Media Pipeline (SFU)

### Non-P2P Group Architecture
Production video conferencing with multiple participants requires an SFU (Selective Forwarding Unit) rather than peer-to-peer mesh. 

1. **Simulcast Streaming:** Each active sender transmits three spatial resolutions:
   - High: 1080p @ 30-60 fps (~2.5 Mbps)
   - Medium: 720p @ 30 fps (~1.0 Mbps)
   - Low: 360p @ 15 fps (~300 Kbps)
2. **Dynamic Bandwidth Adaptation:** The SFU routes video layers based on recipient viewport size, network packet loss, and CPU load.
3. **DTLS-SRTP Encryption:** All audio and video streams are encrypted in transit.
4. **ICE & TURN Fallback:** When UDP is blocked by corporate firewalls, connections seamlessly fallback to TURN relays over TCP/TLS port 443.

---

## 4. State Management & Real-Time Sync

- **Durable State (PostgreSQL):** Users, Organizations, Meetings, Participants, Subscriptions, Invoices, Audit Logs.
- **Ephemeral State (Redis):** Socket connections, real-time participant presence, active speaking indicators, rate-limiting tokens.
- **Client State (React & Web Audio API):** Real-time voice activity detection (VAD), audio level analysers, dynamic grid layouts, screen-sharing streams.
