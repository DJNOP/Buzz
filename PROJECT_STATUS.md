# Project Status

- **Audit date:** 2026-09-17
- **Repository baseline:** `main` contains the implemented Milestones 1–7
  prototype; paused Lighting pre-production remains on its art branch.
- **Current phase:** Gameplay validation
- **Current milestone:** Roadmap Milestone 8 — run one physical
  two-to-four-player Signal Sprint playtest and determine whether players want
  another round.

## Project objective

Create an original, family-friendly shared-screen party game for two to four
people. The host runs on a computer/TV and players use simple phone-browser
controllers. Short games should be immediately understandable, socially
competitive, and replayable.

## Playable state

- `npm.cmd run dev` starts the Socket.IO server, host, and controller locally.
- A host can create one in-memory four-character room. Up to four controllers
  can join by room code or a QR-generated local URL.
- Controllers send paired `down`/`up` events for one primary and four secondary
  buttons. The server associates input with the joined player and room.
- Disconnected controllers have a 20-second token-based reconnection window.
- Signal Sprint is technically playable: lobby, three-second countdown,
  30-second round, per-player targets and scores, 600 ms wrong-input stun,
  first-to-15 finish, timeout/joint winners, replay, and return to lobby.
- The host currently presents Signal Sprint in the provisional Event Rescue
  venue with service robots and slot-derived Lighting, Sound, Event Setup, and
  Machinery stations.
- There is no tournament/cup loop, second minigame, persistence, internet play,
  production deployment, or approved production art/audio.

## Confirmed completed work

- Repository/workspace foundation and source-of-truth documentation.
- One-controller local-network connection and primary-input proof.
- Five-button controller input, in-memory rooms, capacity, isolation,
  disconnect/reconnect, and automated coverage.
- Local QR URL generation, room-code prefilling, address selection, and manual
  join fallback. A real-camera QR acceptance result is not documented.
- One focused server-authoritative Signal Sprint prototype.
- Reversible CSS/PixelLab presentation proof with provenance records and
  retained browser-QA screenshots.

## Current work

No application implementation is currently required. This audit re-established
the repository evidence and documentation.

The paused `art/signal-sprint-lighting-station-kit` branch contains a detailed
Lighting-station pre-production specification and two approved direction
references. A separate unmerged branch,
`feat/signal-sprint-lighting-interaction-diorama`, contains a WIP art-heavy
runtime experiment. Neither is evidence that Signal Sprint is fun, and both
should remain paused until the physical playtest supplies a reason to continue.

## Next

1. Run the documented physical playtest with two to four phones and a TV.
2. Record enjoyment, desire for another round, social/readability issues,
   controller comfort, QR/device friction, and perceived latency.
3. Use that evidence to choose exactly one follow-up: revise Signal Sprint,
   prototype a second game, or resume only the visual work the test justifies.

## Current blockers

No known technical blocker. Product progress now depends on arranging and
recording the physical multiplayer playtest.

## Validation status

| Area | Verified status |
| --- | --- |
| Type safety | `npm.cmd run typecheck` passed on 2026-09-17. |
| Automated tests | 98 tests passed: controller 5, host 33, server 52, shared 8. |
| Production build | `npm.cmd run build` passed on 2026-09-17. |
| Live software smoke | `npm.cmd run smoke` passed against the running stack on 2026-09-17, covering two rooms, joining, all five inputs, isolation, stun, scoring, replay, reconnection, and host closure. |
| Browser/layout QA | Retained screenshots and prior repository records cover host/controller target sizes and one-to-four-player states; this audit did not repeat interactive browser QA. |
| Physical device evidence | Earlier repository records confirm one phone connected and primary input reached the host with low perceived latency. Real-camera QR scanning and a four-phone session remain unverified. |
| Physical multiplayer enjoyment | No documented two-to-four-player playtest. Fun, social clarity, accessibility, controller ergonomics, and desire for another round remain unverified. |

## Minigame pipeline

- **Ideas:** 0 additional concrete minigames found.
- **Candidates:** 0.
- **Prototypes:** 1 — Signal Sprint.
- **Playtested:** 0 with documented physical multiplayer evidence.
- **Approved:** 0 production minigames.
- **Parked/rejected:** 0 documented minigames.

See [Game ideas](docs/game-ideas.md) for the recovered interaction and evidence.

## Important unresolved decisions

- Is Signal Sprint enjoyable and socially readable with two to four people?
- Are the five-button layout and colour/shape identities comfortable and
  distinguishable on real phones and a television?
- Which, if any, Event Rescue, robot, station, and PixelLab work is worth
  retaining after gameplay validation?

## Scope and investment guardrail

Gameplay evidence comes before further bespoke art, additional content, a
generic minigame framework, or a game engine. Prototypes should use a coherent,
reusable visual language that is good enough for meaningful playtesting while
minimizing production-art investment until the interaction is validated.

## Key documents

- [README](README.md) — setup, operation, and manual test instructions.
- [Product definition](docs/product.md) — target experience and product constraints.
- [Architecture](docs/architecture.md) — implemented technical boundaries.
- [Roadmap](docs/roadmap.md) — milestone sequence and current gate.
- [Decisions](docs/decisions.md) — accepted and provisional decisions.
- [Open questions](docs/open-questions.md) — unresolved product/technical choices.
- [Game ideas](docs/game-ideas.md) — gameplay inventory and validation state.
- [PixelLab provenance](docs/art-provenance/pixellab/README.md) — temporary asset audit trail.
- [Agent guidance](AGENTS.md) — repository working rules.
