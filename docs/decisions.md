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

The stack passed real-phone local-network input and joining tests and now
supports multiplayer rooms plus one primitive playable minigame. React/CSS is
sufficient for the current geometric host presentation, while game rules remain
separate from React and Socket.IO transport.

## D-005 — Prototype operational scope

- **Date:** 2026-08-02
- **Status:** Provisional

Start with local-network operation and ephemeral state. The first prototype has no database, authentication, user accounts, online matchmaking, native mobile application, smart-TV application, payments, analytics, advertising, or cloud infrastructure.

Browser-based phone controllers and a desktop-browser host are the chosen prototype surfaces. Native controllers, dedicated television clients, and internet-hosted rooms remain possible later directions, not current commitments.

## D-006 — Defer a dedicated game engine

- **Date:** 2026-08-02
- **Status:** Provisional

Do not introduce a dedicated game engine until controller-to-host communication
and primitive gameplay have been validated. Signal Sprint uses React and CSS
geometric shapes successfully at this technical stage. Engine selection remains
deferred until physical playtest evidence demonstrates a rendering, animation,
content-production, or platform need.

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

## D-010 — Local QR joining and provisional address selection

- **Date:** 2026-08-02
- **Status:** Provisional, implemented for Milestone 6

Generate controller QR codes entirely in the host browser with `qrcode.react` 4.2.0. This focused renderer has built-in TypeScript declarations and no runtime dependencies. Use an unmodified high-contrast SVG with a four-module quiet margin; do not use an external QR service or embed a logo/overlay.

The QR value contains only an HTTP controller URL, selected local IPv4 address, fixed development controller port, and room code. It never includes the private reconnection token. Manual code entry remains a first-class fallback, and the server continues to validate all room joins.

Discover candidate IPv4 addresses in the Node.js server rather than attempting unreliable browser discovery. Exclude internal and unusable entries, prefer common private ranges deterministically, return alternatives to the host, and allow manual user selection when several candidates exist. Do not classify adapters by brittle Wi-Fi/Ethernet/VPN name matching or alter network/firewall settings. This is provisional local-development infrastructure, not internet routing or production service discovery.

## D-011 — Focused server-authoritative Signal Sprint prototype

- **Date:** 2026-08-02
- **Status:** Provisional, implemented for Milestone 7

Build the first gameplay proof as one focused `SignalSprintGame` module per room,
not as a generic minigame engine, plugin system, or new framework. `RoomManager`
continues to own membership, trusted player/socket identity, reconnection,
expiry, and paired input. Signal Sprint separately owns only phase, round ID,
captured participants, targets, scores, mistakes, stuns, deadlines, and winners.

Use injected clock, scheduler, cancellation, and random sources to make all
rules deterministic under fake timers. Production rules use a three-second
countdown, 30-second round, 600 ms stun, and first-to-15 early finish. Timeout
ties remain joint wins; do not introduce a hidden tie-breaker.

Send full game state only to the owning host. Controllers receive minimal
participation/status feedback and never receive the current target, score, or
winners. Host actions contain no room or player authority; the server derives
the room from the validated host-role socket. Replay and return-to-lobby preserve
the existing room and controllers.

Signal Sprint's title, exact rules, symbols, colours, and presentation are
prototype evidence rather than approved production content. Add no engine,
art/audio asset, persistence, tournament flow, or additional minigame until the
physical enjoyment playtest justifies another investment.

## D-012 — Provisional Event Rescue presentation slice

- **Date:** 2026-08-02
- **Status:** Provisional, implemented for themed vertical-slice validation

Test Signal Sprint in an original temporary Event Rescue venue with four
identical neutral service robots. Give each player a redundant presentation
identity—P1 red/circle, P2 blue/square, P3 yellow/triangle, and P4
green/diamond—and keep controller targets visually localized to a separate
station console. Use only repository-owned CSS/HTML geometry for this slice;
introduce no external or generated art asset, audio, animation engine, or game
engine.

Keep this theme strictly out of server game rules and shared protocol. A focused
host presentation module may consume the existing trusted player-input event
for receipt acknowledgement, but correct, wrong, stun, work progress, and
winning/losing states must come only from authoritative game snapshots. Use
time-derived transient states and visible labels so rapid events expire
predictably and reduced-motion presentation retains the information.

Present the unchanged five semantic controller inputs as a vertical layout:
one large round A plus full-width 1 RED, 2 BLUE, 3 YELLOW, and 4 GREEN controls.
This is a physical-playtest candidate, not final world, character, controller,
brand, or production-art approval.

## D-013 — Reversible PixelLab production-pipeline proof

- **Date:** 2026-08-02
- **Status:** Provisional, implemented for pipeline validation

Allow the human-approved neutral service-robot master and four-state light rig
to replace selected CSS presentation states without changing game rules,
networking, scoring, targets, or controller behavior. Keep generated asset URLs
and frame metadata isolated in the host presentation layer. Player identity
continues to use runtime colour and shape overlays rather than baked generated
variants.

The repository-owned CSS robot and station remain the explicit build-time and
image-load fallback; working and losing intentionally remain CSS-only. Keep the
approved runtime derivatives under the host public asset tree and durable
source/provenance under `docs/art-provenance/pixellab/`. Do not track rejected
generations, unselected frames, duplicate exports, or disposable review work.

This proof demonstrates a production workflow only. It does not approve the
assets as final commercial art, resolve licensing or accessibility, authorize
additional generated states, or select PixelLab as a permanent art pipeline.

## D-014 — Provisional shared-venue composition

- **Date:** 2026-08-03
- **Status:** Provisional, implemented for composition validation

Compose active Signal Sprint play as one responsive 16:9 backstage venue with a
central stage, continuous floor, shared truss, original CSS/SVG scenery, and
one open foreground workstation per authoritative participant. Put each
independent semantic target inside that player's equipment desk and keep fixed
player colour/shape identity separate from target tone. One-player play renders
no empty station placeholders; two, three, and four players remain equal members
of the same venue.

Temporarily map every player to one individually labelled segment of the shared
lighting system, using the approved four PixelLab rig states and existing score
thresholds. Segment beams may affect the same stage, but each player's state and
numeric progress must remain independently readable. This is a composition
proof, not approval of four identical final tasks, the current robot/station
art, or the venue as production art.

Keep the composition in focused React components and CSS/SVG. Do not introduce
a canvas or game engine, and do not move presentation concepts into the server,
shared protocol, controller, or Signal Sprint rules. Physical social playtesting
at normal television distance remains the next product gate.

## D-015 — Slot-derived distinct Signal Sprint stations

- **Date:** 2026-08-03
- **Status:** Provisional, implemented for multiplayer presentation validation

Replace the temporary all-lighting presentation with four host-only station
identities derived from the stable player number: P1 lighting, P2 sound, P3
decorations/event setup, and P4 stage machinery. Use the same authoritative
scores and existing broken, partial, nearly operational, and complete thresholds
for every station. Do not add station identity to the network protocol, room
state, controller, or game rules.

Each occupied station affects its own CSS/SVG venue subsystem, so one player's
completion never implies another station's completion. PixelLab PNGs may supply
aligned station props, but CSS fallbacks and reduced-motion text/state remain
available. Results reuse the same station mapping and venue rather than creating
separate flows.

These responsibilities, effects, and generated assets are provisional
playtest material, not final product roles or production art. This change adds
no game engine, networking architecture, scoring difference, or difficulty
difference. Physical multiplayer evidence must decide which roles and art
direction are worth retaining.

## D-016 — Gameplay validation before further visual investment

- **Date:** 2026-09-17
- **Status:** Accepted product-development principle

Use a coherent, reusable prototype visual language that is pleasant and clear
enough for meaningful playtests, but validate gameplay before investing further
in bespoke production art, final characters, a broad asset pipeline, or a large
design system. Presentation work must answer the current gameplay question and
must not substitute for evidence that players enjoy the game and want another
round.

Retain the current Event Rescue, robot, station, PixelLab, Lighting-station, and
unmerged diorama work as provisional evidence. Do not treat it as approved
production direction or continue it by default. The physical two-to-four-player
Signal Sprint playtest is the next decision gate.
