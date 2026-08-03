# Project Status

- **Current phase:** Lighting interaction-diorama validation
- **Current milestone:** Roadmap Milestones 1–7 plus a provisional Lighting-first
  physical interaction standard inside the distinct four-station venue
- **Last completed task:** Revised Lighting into one coherent physical
  robot-console-target workstation, with a dedicated provisional three-quarter
  workset, registered hand/contact geometry, integrated monitor/status,
  authoritative correct/wrong/stun presentation, independent stage-lighting
  consequences, reduced-motion information, and CSS fallback without changing
  game behaviour or upgrading the other three stations.
- **Next recommended task:** Run the documented physical social playtest with two
  to four phones and a television. Review Lighting contact readability, target
  hierarchy, reaction timing, badge placement, shared-stage consequence, and
  coexistence with the intentionally unchanged stations before approving more
  station art or interaction work.
- **Date last updated:** 2026-08-03

## Validation summary

The local-network room, five-button input, reconnection, QR-prefill, manual
join, and Signal Sprint rule foundations remain intact. Strict type checking
passes for every workspace. The suite now contains 112 passing automated tests:
5 controller presentation/input tests, 47 host identity/station/presentation
tests, 52 unchanged server tests, and 8 shared-protocol/query tests.

The production build and live multiplayer smoke scenario pass. The smoke still
covers two rooms, QR-style and manual joins, all five paired controls,
independent targets, correct/wrong input, the exact 600 ms authoritative stun,
ignored stun input, the 15-point finish, replay, reconnection, room isolation,
and host cleanup.

The compact PixelLab proof now contains 78 transparent runtime PNGs, including
16 distinct four-station states and 24 selected Lighting workset artifacts.
Manifest paths and hashes, generated/runtime dimensions, hard alpha, stable
floor registration, unique station hashes, selected sources, both feature-flag
build modes, and byte-identical build copies pass focused validation. Rejected
and disposable generations remain untracked.

The approved 96x96 R02 structural source and neutral master, six general robot
animation sequences, four dedicated Lighting sequences, four 128x96 light-rig
states, twelve 128x96 station states, job IDs, seeds, frame selections, crops,
cleanup rectangles, masks, hashes, and alignment decisions remain reproducible.
The Lighting pass used exactly 10 subscription generations (1,423 to 1,413
remaining) and no credits. Selected frames and sprite sheets live with runtime
assets; durable sources and the consolidated audit record live in
`docs/art-provenance/pixellab/`. Disposable PixelLab work is narrowly ignored
at `temp/pixellab/`.

In-app browser QA for this revision covered work idle, contact/correct, wrong,
stunned, partial progress, complete, and results at a true 1920x1080 embedded
one-player viewport; active, contact, mixed progress, stunned, and results at
native 1280x720 four-player size; and representative one- and four-player
PixelLab-disabled fallback. The cue and status stayed inside one physical
monitor, the console overlapped the robot, the torso badge remained
runtime-rendered, and Lighting retained an equal four-player footprint. Every
active route had exactly one integrated target, no detached status card, and
zero document overflow. The generated working-hand anchor stayed within 15 px
of the console contact in one-player presentation and 18 px at four-player
size. This browser surface did not expose a console-message reader, so semantic
DOM checks plus clean typecheck, tests, builds, and smoke validation remain the
available diagnostics for this pass.

The generated-asset path covers dedicated Lighting work idle, reach/contact,
wrong recoil, stunned hold, the shared winning sequence, and all 16
station-state mappings; CSS remains the build-time and image-load fallback.
Completed winner stations
and their station-specific venue consequences remain visible in results.
Controller content has no document overflow at exact 390×844, 360×800, or
390×667 measurements and keeps the complete A plus 1–4 stack visible in active,
stunned, lobby, and results states. Prior direct host and controller console
evidence remains clean. The development-only full-HD capture frame is isolated
from production builds and does not change gameplay or network state.

## Current presentation and architecture

Signal Sprint keeps the existing focused `SignalSprintGame` and protocol. No
server, shared-protocol, scoring, target, timing, tie, lifecycle, replay, or room
isolation code changed in this slice.

The host now renders one layered original CSS/SVG backstage venue with a central
stage, continuous floor, equipment, cables, curtains, and one shared truss. Each
participant receives one approved PixelLab service-robot master, a larger open
foreground workstation, an integrated semantic target display, and a
slot-derived PixelLab-backed station prop. Identity remains fixed
by player number: P1 red/circle, P2 blue/square, P3 yellow/triangle, and P4
green/diamond. The reusable robot still exposes idle, input acknowledgement,
correct, wrong, stunned, working, winning, and losing presentation states.

`SharedVenue` composes `VenueStage`, `VenueSystemsProgress`, and only the
authoritative participants' `PlayerWorkstation` components. One player occupies
most of the foreground, two use equal connected bays, three use three equal
columns, and four remain readable in one row at 1280×720. Countdown and results
reuse the same venue; winners receive prominent robots while every player keeps
jobs, mistakes, identity, and winning/losing state in the secondary scoreboard.

Lighting alone now branches into a focused `LightingInteractionDiorama`. Its
explicit visual layers preserve background-to-foreground depth, place a
three-quarter robot physically behind the stepped console, mount the dynamic
accessible cue and status inside one monitor, and align the working hand with a
real console contact. Stable head, torso, working-hand, feet, and
station-contact anchors register the runtime badge and contact treatment.
Authoritative presentation
states select neutral, acknowledged, positive, warning, locked, recovery, or
complete feedback; animation never supplies gameplay authority. Existing
Lighting progress still maps independently to broken, partial, nearly
operational, and complete venue illumination.

A small pure host presentation module consumes trusted server-received down
events for acknowledgement and authoritative game snapshots for correct,
wrong, stun, working, and result states. Time-derived transient windows prevent
old or rapid feedback from becoming stuck. Visible state labels preserve the
same information when motion is reduced. Asset URLs, frame metadata, progress
thresholds, and the build-time feature toggle are isolated in a separate host
asset module. The host overlays the existing recolourable shape on the blank
robot chest rather than baking player variants into generated art.

Robot `idle`, input acknowledgement, correct, wrong, stunned, and winning use
animated PNGs. Lighting maps its live states to the dedicated work-idle,
reach/contact, wrong-recoil, and stunned-hold workset while reusing the approved
winning sequence in results. Working elsewhere and losing intentionally use
the preserved CSS robot; image load errors also fall back to CSS. Each occupied
slot owns one visually
distinct event-production station: P1 lighting, P2 sound, P3 decorations/event
setup, and P4 stage machinery. All use the same score-driven broken, partial,
nearly operational, and complete states, but independently affect fixtures,
speakers/signals, venue dressing, or stage curtains/backdrop/platform.
`VITE_SIGNAL_SPRINT_PIXELLAB_SPRITES=false` disables generated assets.

The joined controller is now one large round A action above four full-width
controls in fixed order: 1 RED, 2 BLUE, 3 YELLOW, and 4 GREEN. The underlying
semantic identifiers, pointer/key pairing, cancellation and focus release,
haptics, disabled states, reconnect flow, QR/manual joining, and target privacy
are unchanged.

## Remaining risks and manual validation

The Event Rescue world, service robots, workstations, station props, button
presentation, and Signal Sprint content are still provisional validation
material rather than final branding or production art. The current slot-to-role
mapping and all four station responsibilities still require physical multiplayer
playtesting. CSS/SVG presentation and browser measurements do not
establish fun, social clarity, viewing comfort on a real television, controller
comfort, accessibility with real players, perceived latency with four phones, or
a desire for another round.

The approved source and generation record remain reviewable under
`docs/art-provenance/pixellab/`; the two user-approved direction references and
their interpretation live under `docs/design-references/signal-sprint/` and are
not runtime assets. Runtime copies are loaded from
`apps/host/public/assets/pixellab/` by the reversible presentation path. The CSS
working/losing robot outside Lighting is visibly taller and stylistically
different from the PixelLab master; resolving that mismatch requires a later
human-approved art milestone. No new dependency, audio,
animation engine, generic minigame framework, tournament flow, persistence,
hosting, or deployment was introduced. Final name, identity, commercial
character art, accessibility standards, distribution, monetisation, engine
choice, and art/audio pipelines remain unresolved.
