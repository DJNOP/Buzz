# Provisional Architecture

## Status

This document describes a working technical direction, not a permanent architecture. The early milestones exist to test its assumptions. Technology or boundaries may change when prototype evidence justifies a decision.

## Proposed system

The initial web system is provisionally composed of:

1. **Shared host interface** — React with Vite and TypeScript, running in a desktop browser and rendering the lobby, shared gameplay, scores, and tournament state.
2. **Phone-controller interface** — React with Vite and TypeScript, running in each player's phone browser and presenting the standard five-button controller.
3. **Real-time server** — Node.js with Socket.IO, creating rooms and relaying typed connection, identity, input, game-state, disconnection, and reconnection events.
4. **Shared protocol definitions** — TypeScript types and event contracts used by host, controller, and server.
5. **Core game logic** — deterministic rules and state transitions kept independent of React rendering and, where practical, independent of browser-only APIs.

No packages, directory layout, or application scaffold have been selected or installed yet.

## Target interaction flow

This is the intended direction across later roadmap milestones, not the required implementation for the first controller-to-host slice. Milestones 1 and 2 intentionally use one host, one controller, and one shared real-time channel without rooms, persistent player identities, scoring, or game state.

1. The host creates a room through the desktop browser.
2. Players join from phone browsers using a short room code or, in a later milestone, a QR code.
3. The server assigns or maintains a unique player identity within the room.
4. A phone sends a compact, typed button-input event.
5. The server validates and routes the event to the correct room and host.
6. Game logic interprets the input and updates authoritative state.
7. The host renders immediate shared-screen feedback.

The exact authority model and event schema will be decided during implementation; they must not be invented as part of repository setup.

## Responsibility boundaries

| Area | Owns | Must not own |
| --- | --- | --- |
| Host frontend | Shared-screen rendering, host navigation, presentation feedback | Network transport internals or phone UI |
| Controller frontend | Join flow, player-local feedback, input capture | Authoritative scoring or shared game state |
| Server | Rooms, connections, input validation/routing, player lifecycle | Visual presentation |
| Shared protocol | Cross-process event names, payload types, shared identifiers | React components or transport side effects |
| Core game logic | Rules, state transitions, scoring logic | Browser rendering or Socket.IO connections |

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
