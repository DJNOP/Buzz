# Provisional Architecture

## Status

This document describes a working technical direction, not a permanent architecture. The early milestones exist to test its assumptions. Technology or boundaries may change when prototype evidence justifies a decision.

## Implemented prototype system

The current npm-workspaces system is composed of:

1. **Shared host interface (`apps/host`)** — React with Vite and TypeScript, rendering connection state, one geometric input visualizer, a valid-press counter, and receipt-time diagnostics.
2. **Phone-controller interface (`apps/controller`)** — React with Vite and TypeScript, presenting one large primary button with pointer, keyboard, assistive-click, visual, and optional vibration feedback.
3. **Real-time server (`apps/server`)** — Node.js with Socket.IO, validating a host/controller connection role and primary-button payload before forwarding the event to currently connected host sockets.
4. **Shared protocol (`packages/shared`)** — Socket.IO event names, payload types, connection-role types, and runtime validation functions used by both clients and the server.

There is no core game-logic package yet because this slice contains no game, scoring, or authoritative game state. Add that boundary only when a playable-minigame milestone creates a concrete need.

## Current input flow

1. The host and controller independently connect to the same server and declare a transient role in the Socket.IO handshake.
2. The server rejects connections with malformed or unsupported role data.
3. One controller activation emits `controller:primary-button` with a numeric client timestamp.
4. The server verifies the sender is a controller and validates the exact payload shape.
5. The server creates `host:primary-button` with the controller timestamp and server receipt time, then emits it to every currently connected host socket.
6. The host increments its local diagnostic count, records browser receipt time, and replays the shape animation.

No Socket.IO room, room code, player identity, persistent state, or game state exists. The transient set of host socket IDs is the only application state on the server.

## Local-network addressing

The server listens on `0.0.0.0:3001`. Both Vite development servers listen on all interfaces at fixed ports: host `5173`, controller `5174`. Each browser derives the server URL from `window.location.hostname` and port `3001`, with an optional `VITE_SERVER_URL` override for development. This supports both `localhost` and private IPv4 access without storing a machine-specific address.

## Target interaction flow

This is the intended direction across later roadmap milestones, not the required implementation for the first controller-to-host slice. Milestones 1 and 2 intentionally use one host, one controller, and one shared real-time channel without rooms, persistent player identities, scoring, or game state.

1. The host creates a room through the desktop browser.
2. Players join from phone browsers using a short room code or, in a later milestone, a QR code.
3. The server assigns or maintains a unique player identity within the room.
4. A phone sends a compact, typed button-input event.
5. The server validates and routes the event to the correct room and host.
6. Game logic interprets the input and updates authoritative state.
7. The host renders immediate shared-screen feedback.

The authority model for game state remains unresolved because this slice has no game state. The implemented input event contract is intentionally narrow and should be extended only when a later milestone requires another event.

## Responsibility boundaries

| Area | Owns | Must not own |
| --- | --- | --- |
| Host frontend | Shared-screen connection state, input visualization, local diagnostics | Network validation, phone UI, scoring, or game rules |
| Controller frontend | Connection state, accessible input capture, immediate local feedback | Authoritative scoring, shared game state, or host presentation |
| Server | Connection roles, runtime input validation, transient host tracking, event forwarding | Rooms, persistent identity, game state, or visual presentation |
| Shared protocol | Cross-process event names, payload types, shared identifiers | React components or transport side effects |
| Future core game logic | Rules, state transitions, scoring logic when a minigame requires them | Browser rendering or Socket.IO connections |

These boundaries should keep core rules from becoming unnecessarily coupled to the initial browser host, leaving open the possibility of another host client later.

## Initial operational scope

- Local-network operation first.
- Two to four players is the initial product target; the first connection and input-loop milestones validate only one controller and one host.
- No database in the first prototype; state is ephemeral.
- No authentication or user accounts.
- No online matchmaking.
- No native mobile or smart-TV application.
- No payments, analytics, advertising, or cloud infrastructure.
- No dedicated game engine until controller-to-host communication has been validated.

## Quality concerns for early validation

- Input latency and visible acknowledgement.
- Duplicate or malformed input handling.
- Phone ergonomics, touch behaviour, viewport handling, and accessibility.
- Clear separation between protocol, transport, game rules, and rendering.
- Automated tests at stable boundaries, especially protocol and game rules.

Room isolation, maximum capacity, persistent player identity, disconnection, and reconnection behaviour belong to later roadmap milestones and should not be introduced during the first input-loop slice.

Security, internet deployment, persistence, scaling, and production observability are intentionally deferred until the product requires them. Local-network operation still requires basic validation of client-provided events and safe handling of unexpected input.

## Current validation coverage

- TypeScript compilation checks all four workspaces and includes compile-time shared-event contract assertions.
- Socket.IO integration tests cover valid forwarding, malformed and unsupported input, and repeated controller connections.
- A controller unit test protects the pointer/click deduplication decision.
- Production builds verify the shared package, server output, and both Vite applications.
- A same-computer smoke test verified both browser pages, the Socket.IO handshake, and a live forwarded primary-button event.

A real phone and private network are still required to validate firewall behaviour, touch ergonomics, vibration support, and real-world latency.
