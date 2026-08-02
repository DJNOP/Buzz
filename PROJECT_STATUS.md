# Project Status

- **Current phase:** Themed Signal Sprint vertical-slice validation
- **Current milestone:** Roadmap Milestones 1–7 plus the provisional themed
  presentation slice implemented
- **Last completed task:** Reframed Signal Sprint as an original temporary
  Event Rescue venue with four reusable service robots, operational stations,
  a trusted/authoritative presentation-state model, and a vertical phone
  controller while preserving every server-authoritative game rule.
- **Next recommended task:** Run the documented physical two-to-four-player
  Signal Sprint enjoyment, TV-readability, and controller-ergonomics playtest.
- **Date last updated:** 2026-08-02

## Validation summary

The local-network room, five-button input, reconnection, QR-prefill, manual
join, and Signal Sprint rule foundations remain intact. Strict type checking
passes for every workspace. The suite now contains 71 passing automated tests:
5 controller presentation/input tests, 6 host identity/presentation tests, 52
unchanged server tests, and 8 shared-protocol/query tests.

The production build and live multiplayer smoke scenario pass. The smoke still
covers two rooms, QR-style and manual joins, all five paired controls,
independent targets, correct/wrong input, the exact 600 ms authoritative stun,
ignored stun input, the 15-point finish, replay, reconnection, room isolation,
and host cleanup.

In-app browser QA covered host entry, QR lobby, countdown, active one-, two-,
and four-player layouts, immediate wrong feedback, authoritative stun, trusted
input acknowledgement, results, replay, and return to lobby. The host has no
document overflow at exact 1280×720 or exact 1920×1080 viewport measurements.
Controller content has no document overflow at exact 390×844, 360×800, or
390×667 measurements and keeps the complete A plus 1–4 stack visible in active,
stunned, lobby, and results states. Direct host and controller consoles were
free of errors and warnings. Temporary viewport QA wrappers were removed.

## Current presentation and architecture

Signal Sprint keeps the existing focused `SignalSprintGame` and protocol. No
server, shared-protocol, scoring, target, timing, tie, lifecycle, replay, or room
isolation code changed in this slice.

The host now renders a layered original CSS venue with one operational station
and one identical neutral service-robot body per participant. Identity is
redundant and fixed by player number: P1 red/circle, P2 blue/square, P3
yellow/triangle, and P4 green/diamond. Signal targets remain separate console
cues. The reusable robot exposes idle, input acknowledgement, correct, wrong,
stunned, working, winning, and losing presentation states.

A small pure host presentation module consumes trusted server-received down
events for acknowledgement and authoritative game snapshots for correct,
wrong, stun, working, and result states. Time-derived transient windows prevent
old or rapid feedback from becoming stuck. Visible state labels preserve the
same information when motion is reduced.

The joined controller is now one large round A action above four full-width
controls in fixed order: 1 RED, 2 BLUE, 3 YELLOW, and 4 GREEN. The underlying
semantic identifiers, pointer/key pairing, cancellation and focus release,
haptics, disabled states, reconnect flow, QR/manual joining, and target privacy
are unchanged.

## Remaining risks and manual validation

The Event Rescue world, service robots, button presentation, and Signal Sprint
content are still provisional validation material rather than final branding or
production art. CSS/SVG presentation and browser measurements do not establish
fun, social clarity, viewing comfort on a real television, controller comfort,
accessibility with real players, perceived latency with four phones, or a desire
for another round.

No external or generated visual assets, new dependency, audio, animation
engine, generic minigame framework, tournament flow, persistence, hosting, or
deployment were introduced. Final name, identity, characters, accessibility
standards, distribution, monetisation, engine choice, and art/audio pipelines
remain unresolved.
