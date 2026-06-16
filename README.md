# 💜 HeartCave

**You're Not Alone.**

HeartCave is an anonymous emotional **peer-support** platform. Its purpose is to help people realize they are not alone by connecting them — intentionally and safely — with others who are navigating similar struggles.

HeartCave is **not** a random stranger chat app. There is no global chat and no unsolicited messaging. Every conversation begins through a mutual connection request, and people are matched on what they actually have in common: their current struggles, their interests, and their age group.

> ⚠️ **Disclaimer:** HeartCave is a peer-support platform. It is **not** a replacement for professional mental health care and does not provide therapy, diagnosis, or emergency crisis intervention.

Made with ❤️ by Shara

---

## Table of Contents

- [Features](#features)
- [AI Features (Phase 1)](#ai-features-phase-1)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Running the Backend](#running-the-backend)
- [Running the Frontend](#running-the-frontend)
- [Seeding the Database](#seeding-the-database)
- [Credentials](#credentials)
- [Security Features](#security-features)
- [Deployment Guide](#deployment-guide)
- [Future Improvements](#future-improvements)

---

## Features

### Anonymous but accountable identity
- Every user receives an auto-generated anonymous handle (e.g. `BraveSoul27`, `HopefulRiver12`, `CalmPhoenix44`).
- Real names and emails are stored securely but **never** shown publicly. There is no search by real name or email anywhere in the product.
- Only admins can view real identities, and only for moderation.

### Intentional matching (the core feature)
- A weighted compatibility algorithm scores potential matches:
  - **Shared struggles** → 60 points
  - **Shared interests** → 25 points
  - **Shared age group** → 15 points
- Categories: **Perfect (90–100)**, **Strong (70–89)**, **Good (50–69)**; anything below 50 is ignored.
- A **match queue** fallback means the platform works even with few users — seekers are stored and re-evaluated automatically when new users register, so connections can form asynchronously without both people being online.

### Connection-request flow
- No one can message a stranger. The flow is: find matches → send a connection request → the other person accepts or rejects → private chat unlocks **only** after acceptance.

### Private real-time chat
- Powered by Socket.io: live messaging, typing indicators, online/offline presence, read receipts, timestamps, and private per-match rooms.
- Safety controls (**Report**, **Block**, **Leave Conversation**) are permanently visible on every chat screen — never hidden behind a menu.

### Support feed (secondary)
- Users share experiences and encourage others. Reactions are supportive rather than vanity metrics: ❤️ Sending Support, 🤗 I Relate, 💪 Stay Strong, 🌟 You Inspire Me.
- Comments and "experience shares" are supported. Pagination and search included.

### Kindness reputation system
- After a conversation, users rate their buddy: **Good Listener**, **Respectful**, **Encouraging**, **Supportive**.
- Ratings build a kindness score and unlock badges: **Good Listener**, **Supportive Friend**, **Trusted Buddy**, **Heart Hero**.

### Safety & moderation
- A community safety policy is shown and must be accepted at registration.
- **Three-strike enforcement:** warning → 24-hour suspension → permanent ban, with full violation history.
- **Instant-ban offenses** (threats, sexual misconduct, grooming, hate speech, self-harm encouragement) bypass warnings and raise moderator alerts.
- Reporting supports detailed reasons, descriptions, status, and admin notes.

### Admin & moderation dashboard
- Separate admin login. Statistics cards (users, posts, matches, messages, reports, active users) plus **safety statistics**: open/resolved reports, flagged messages, suspended/banned users, most-reported categories, and average resolution time.
- Tools to view users (with real identity for moderation), warn/suspend/ban/unban, review reports, review moderation logs, view chat logs, and delete harmful content.

---

## AI Features (Phase 1)

AI in HeartCave exists **only** to improve safety and matching quality. It never acts as a therapist, counselor, or diagnostician, and never replaces human-to-human connection. All AI runs through a provider-abstraction layer (`server/services/ai/`) so the provider can be swapped via environment variables. A fully offline **rules-based provider** is the default, so the app works with no API key; an OpenAI provider is included as a drop-in alternative.

1. **Message moderation** — every message is classified (`SAFE` / `FLAGGED` / `BLOCKED`) **before** storage. Status, reason, and timestamp are saved with each message and logged to `ModerationLog`.
2. **Automatic safety alerts** — `BLOCKED` messages are not delivered; evidence is stored, the sender's violation count increments, and severe cases create high-priority admin notifications.
3. **Match explanation** — a short, friendly "Why We Matched" summary accompanies each match (shared struggles/interests/age group + compatibility %).
4. **Conversation starters** — 3–5 supportive, non-invasive prompts generated from shared interests and struggles after a match.
5. **Supportive language check** — before sending, a message that may read as hurtful triggers a gentle "would you like to revise it?" prompt. The user can edit or send anyway; moderation still applies.

---

## Architecture

```
                ┌─────────────────────────────┐
                │      React + Vite client     │
                │  Tailwind · Axios · Socket.io │
                └───────────────┬──────────────┘
                       HTTP /api │ WebSocket /socket.io
                                 ▼
                ┌─────────────────────────────┐
                │     Express API server       │
                │  JWT auth · RBAC · Socket.io │
                │  AI service layer (provider) │
                └───────────────┬──────────────┘
                                 ▼
                ┌─────────────────────────────┐
                │   MongoDB (Mongoose ODM)     │
                └─────────────────────────────┘
```

- **Backend:** Node.js + Express (ES modules), Mongoose, JWT access + refresh tokens (refresh token in an httpOnly cookie scoped to `/api/auth`), Socket.io authenticated by JWT, and a pluggable AI service layer.
- **Frontend:** React 18 + Vite, React Router v6, Tailwind CSS, Axios (with an interceptor that auto-refreshes expired access tokens), Socket.io client, React Hot Toast, and Context API for auth state.

---

## Folder Structure

```
heartcave/
├── README.md
├── .gitignore
├── server/
│   ├── config/          # db connection, constants (struggles, interests, weights, badges…)
│   ├── controllers/     # auth, post, match, chat, user, admin
│   ├── middleware/       # auth/RBAC, validation, rate limiting, error handling
│   ├── models/          # User, Post, ConnectionRequest, Match, Message, Rating,
│   │                    #   Report, ModerationLog, Notification, MatchQueue
│   ├── routes/          # auth, posts, match, chat, users, admin, index (+ health/meta/hope)
│   ├── services/
│   │   ├── matchService.js
│   │   └── ai/          # provider abstraction + moderation/explanation/starters/language
│   ├── sockets/         # Socket.io handlers (presence, rooms, messaging)
│   ├── utils/           # anonymous-name generator, tokens, errors, kindness helpers
│   ├── seeds/           # demo data seeder
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── client/
    ├── src/
    │   ├── components/   # common, posts, matching, chat
    │   ├── pages/        # auth, dashboard, matching, requests, chats, profile + admin/
    │   ├── context/      # AuthContext
    │   ├── services/     # api (axios), socket
    │   ├── utils/        # constants, formatting helpers
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── postcss.config.js
```

---

## Environment Variables


```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/heartcave

# JWT
JWT_ACCESS_SECRET=replace-with-a-long-random-string
JWT_REFRESH_SECRET=replace-with-another-long-random-string
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# AI provider ("rules" works fully offline; "openai" needs a key)
AI_PROVIDER=rules
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

The frontend talks to the backend through Vite's dev proxy (`/api` and `/socket.io` → `http://localhost:5000`), so no client env file is required for local development.

---


## Security Features

- bcrypt password hashing.
- JWT access tokens plus refresh tokens; the refresh token lives in an httpOnly, path-scoped cookie and the client auto-refreshes on `401`.
- Role-based access control and protected routes (user vs. admin).
- Helmet security headers, configurable CORS, and request rate limiting.
- Input validation (express-validator) and Mongo query sanitization.
- Ban / suspension handling enforced on every authenticated request.
- AI moderation on messages before they are stored or delivered, with full moderation logging.
- Privacy by design: real names and emails are never serialized into any public response.

---


## Future Improvements

- Email verification and password reset flows.
- Push / email notifications for new connection requests and messages.
- Richer AI moderation via the OpenAI provider, plus human-in-the-loop review tooling.
- Guide status and priority matching for high-reputation users.
- Group support circles around shared struggles.
- Internationalization and accessibility audits.
- End-to-end and integration test suites, plus CI/CD.

---

Made with ❤️ by Shara
