# Project Status

- **Current phase:** Distinct-station Signal Sprint presentation validation
- **Current milestone:** Roadmap Milestones 1–7 plus the provisional themed
  four-station shared-venue composition implemented
- **Last completed task:** Replaced the temporary all-lighting workstations with
  slot-derived lighting, sound, decorations/event-setup, and stage-machinery
  presentations, aligned four-state PixelLab props, independent venue effects,
  CSS fallbacks, and station-aware results without changing game behaviour.
- **Next recommended task:** Run the documented physical social playtest with two
  to four phones and a television. Review shared-stage readability, robot motion,
  task clarity, target/identity separation, results, and the known CSS-only
  `working`/`losing` art mismatch before approving more art or merging.
- **Date last updated:** 2026-08-03

## Validation summary

The local-network room, five-button input, reconnection, QR-prefill, manual
join, and Signal Sprint rule foundations remain intact. Strict type checking
passes for every workspace. The suite now contains 98 passing automated tests:
5 controller presentation/input tests, 33 host identity/station/presentation
tests, 52 unchanged server tests, and 8 shared-protocol/query tests.

The production build and live multiplayer smoke scenario pass. The smoke still
covers two rooms, QR-style and manual joins, all five paired controls,
independent targets, correct/wrong input, the exact 600 ms authoritative stun,
ignored stun input, the 15-point finish, replay, reconnection, room isolation,
and host cleanup.

The compact PixelLab proof now contains 54 transparent runtime PNGs, including
16 distinct four-station states. Manifest paths and hashes, 128x96 station
dimensions, hard alpha, unique station hashes, selected sources, both
feature-flag build modes, and byte-identical build copies pass focused
validation. Rejected and disposable generations remain untracked.

The approved 96x96 R02 structural source and neutral master, six selected robot
animation sequences, four 128x96 light-rig states, twelve new 128x96 station
states, job IDs, seeds, frame
selections, masks, and alignment decisions remain reproducible. Selected frames
and sprite sheets live with runtime assets; durable sources and the consolidated
audit record live in `docs/art-provenance/pixellab/`. Disposable PixelLab work is
narrowly ignored at `temp/pixellab/`.

In-app browser QA covered one-, two-, three-, and four-player active layouts at
1280x720; one- and four-player active layouts, independent mixed progress, and
joint-winner results at 1920x1080; and results at both scales. Every measured
view had zero document overflow and no clipped workstation, cue, station prop,
or robot bounds. An authoritative wrong input and resulting misroute were
observed; the 600 ms stun cleared before the new screenshot completed, so the
existing dedicated stunned proof remains the retained visual record. Computed
identity accents remained red, blue, yellow, and green while targets retained
their independent semantic tone. Direct host and controller console logs were
free of warnings and errors.

The generated-asset path still covers idle, correct, wrong, stunned, working CSS
fallback, winning, and all 16 station-state mappings. Completed winner stations
and their station-specific venue consequences remain visible in results.
Controller content has no document overflow at exact 390×844, 360×800, or
390×667 measurements and keeps the complete A plus 1–4 stack visible in active,
stunned, lobby, and results states. Direct host and controller consoles were
free of errors and warnings. Temporary viewport QA wrappers were removed.

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

A small pure host presentation module consumes trusted server-received down
events for acknowledgement and authoritative game snapshots for correct,
wrong, stun, working, and result states. Time-derived transient windows prevent
old or rapid feedback from becoming stuck. Visible state labels preserve the
same information when motion is reduced. Asset URLs, frame metadata, progress
thresholds, and the build-time feature toggle are isolated in a separate host
asset module. The host overlays the existing recolourable shape on the blank
robot chest rather than baking player variants into generated art.

Robot `idle`, input acknowledgement, correct, wrong, stunned, and winning use
animated PNGs. Working and losing intentionally use the preserved CSS robot;
image load errors also fall back to CSS. Each occupied slot owns one visually
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
`docs/art-provenance/pixellab/`; the supplied design reference remains under
`docs/art-references/`. Runtime copies are loaded from
`apps/host/public/assets/pixellab/` by the reversible presentation path. The CSS
working/losing robot is visibly taller
and stylistically different from the PixelLab master; resolving that mismatch
requires a later human-approved art milestone. No new dependency, audio,
animation engine, generic minigame framework, tournament flow, persistence,
hosting, or deployment was introduced. Final name, identity, commercial
character art, accessibility standards, distribution, monetisation, engine
choice, and art/audio pipelines remain unresolved.
