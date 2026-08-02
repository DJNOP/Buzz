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

This stack will be tested through the connection and input-loop milestones before being treated as a long-term commitment. No dependencies or scaffolds are created by this decision alone.

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
