# Decision Log

This log separates durable constraints from provisional technical choices. Provisional decisions should be revisited when prototype evidence provides a reason; they must not silently become permanent assumptions.

## D-001 — Shared-screen, phone-controller product shape

- **Date:** 2026-08-02
- **Status:** Accepted product direction

The main experience takes place on a shared television or computer display. Initially, two to four players use browser-based phone controllers without installing an application. The standard controller has one large primary action button and four smaller coloured buttons and remains the common input scheme for at least the first three prototype minigames.

A simple tournament or cup is the initial overall structure. A board-game structure is outside the MVP.

## D-002 — Family-friendly positioning

- **Date:** 2026-08-02
- **Status:** Accepted product constraint

The game is family-friendly but intended to remain enjoyable for adults with friends. It is neither specifically a children's game nor a drinking game. Player-created social drinking rules are outside the product; alcohol will not appear in core gameplay, branding, scoring, or the initial experience.

## D-003 — Originality and asset governance

- **Date:** 2026-08-02
- **Status:** Accepted, non-negotiable

The product will not use existing game-brand names or copy protected characters, environments, assets, presentation, controller appearance, or concrete minigames. Functional simplicity may be inspired by the broad idea of one large action input and four coloured inputs, but all expressive implementation—including arrangement, shapes, styling, symbols, terminology, feedback, characters, world, and presentation—must be original.

Temporary external assets require documented sources and licences. AI-generated or AI-assisted visual work may support internal concepts and prototypes, but every external or AI-assisted asset needs documented provenance, generation method, licence, intended commercial rights, and usage restrictions before commercial release. Consistency, quality, audio, branding, and rights require a deliberate production pipeline.

## D-004 — Initial web technology

- **Date:** 2026-08-02
- **Status:** Provisional

Use TypeScript throughout the initial web system, React with Vite for both the shared host and phone-controller interfaces, Node.js with Socket.IO for real-time communication, and shared TypeScript definitions for the communication protocol.

The stack passed the first real-phone local-network input test and has now supported the multiplayer room foundation. It remains provisional until a playable-minigame milestone reveals the rendering and game-logic requirements.

## D-005 — Prototype operational scope

- **Date:** 2026-08-02
- **Status:** Provisional

Start with local-network operation and ephemeral state. The first prototype has no database, authentication, user accounts, online matchmaking, native mobile application, smart-TV application, payments, analytics, advertising, or cloud infrastructure.

Browser-based phone controllers and a desktop-browser host are the chosen prototype surfaces. Native controllers, dedicated television clients, and internet-hosted rooms remain possible later directions, not current commitments.

## D-006 — Defer a dedicated game engine

- **Date:** 2026-08-02
- **Status:** Provisional

Do not introduce a dedicated game engine until controller-to-host communication has been validated. The first primitive minigame can use simple shapes. Engine selection depends on evidence from the input loop and first playtest.

## D-007 — Preserve host portability

- **Date:** 2026-08-02
- **Status:** Provisional architectural principle

Keep frontend, real-time server, shared protocol, and game-rule responsibilities distinct. Avoid unnecessarily coupling core game rules to the first browser host so another host client could potentially be introduced later. This does not require speculative abstractions; separation should grow only as current milestones require it.

## D-008 — Minimal workspace and endpoint structure

- **Date:** 2026-08-02
- **Status:** Provisional, implemented for the first input slice

Use native npm workspaces for `apps/host`, `apps/controller`, `apps/server`, and `packages/shared`, without a monorepo orchestration framework. A small repository-owned Node script starts the three development processes after building the shared protocol package.

For local-network development, use fixed ports (`5173` host, `5174` controller, `3001` server), listen on all interfaces, and derive the server hostname from the browser page by default. An optional environment override may replace the server URL, but no machine-specific IP address belongs in source control.

For Milestones 1 and 2, use a validated transient host/controller role and a set of connected host socket IDs. Do not introduce Socket.IO rooms, persistent identities, scoring, or game state until the corresponding roadmap milestone requires them.

The first real-phone test confirmed local-network reachability, low perceived latency, and correct primary-button deduplication. The structure remains provisional while the five-button and multi-controller ergonomics await a broader manual test.

## D-009 — In-memory rooms and temporary reconnection capability

- **Date:** 2026-08-02
- **Status:** Provisional, implemented for Milestones 4 and 5

Keep one authoritative in-memory room model in the server process. Each host owns at most one generated four-character room. A room contains up to four stable players, including disconnected players whose slots are reserved during a 20-second grace period.

Controllers receive a 256-bit random base64url reconnection token stored in local browser storage. The token restores the same player after reload or a brief interruption, but it is not authentication, is never exposed in public room state or logs, and is invalidated by player expiry, host disconnection, or server restart. Do not add JWTs, sessions, Redis, a database, or accounts for this prototype mechanism.

Derive trusted player and room identity from the joined socket for every input. The five-button protocol uses neutral semantic button identifiers plus `down`/`up`; visual colour, symbol, and label choices remain configurable frontend presentation and unresolved product design.
