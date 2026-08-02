# Project Status

- **Current phase:** Themed Signal Sprint vertical-slice validation
- **Current milestone:** Roadmap Milestones 1–7 plus the provisional themed
  presentation slice implemented
- **Last completed task:** Completed the approved PixelLab production-pipeline
  proof: added correct, wrong, stunned, and winning robot animations, generated
  one aligned four-state light-rig family, and integrated both behind a
  reversible host presentation path with the existing CSS fallback retained.
- **Next recommended task:** Human-review the robot motion, light-rig progression,
  results presentation, and the visible scale mismatch when the intentionally
  CSS-only `working`/`losing` states are shown. Do not generate additional art or
  merge this branch without explicit approval.
- **Date last updated:** 2026-08-02

## Validation summary

The local-network room, five-button input, reconnection, QR-prefill, manual
join, and Signal Sprint rule foundations remain intact. Strict type checking
passes for every workspace. The suite now contains 74 passing automated tests:
5 controller presentation/input tests, 9 host identity/presentation tests, 52
unchanged server tests, and 8 shared-protocol/query tests.

The production build and live multiplayer smoke scenario pass. The smoke still
covers two rooms, QR-style and manual joins, all five paired controls,
independent targets, correct/wrong input, the exact 600 ms authoritative stun,
ignored stun input, the 15-point finish, replay, reconnection, room isolation,
and host cleanup.

The art pipeline proof contains four initial PixelLab `create_image_pixflux`
outputs plus two `edit_image` reference-mode refinements. Human review approved
R02 as the prototype structural source. A PixelLab `inpaint_image` mouth edit
produced a neutral 96x96 transparent master with zero pixel changes outside its
10x6 mask.

Six PixelLab `animate_image` proofs now derive from that neutral master: idle,
input acknowledgement, correct, wrong, stunned, and winning. The first selected
frame of every animation is the exact approved neutral PNG. Raw results,
selected frames, transparent sprite sheets, animated PNGs, review GIFs, jobs,
and seeds are retained. A forbidden star-eye winning frame was repaired with a
PixelLab eye-only inpaint; the other star-eye frame remains excluded.

One 128x96 transparent light-control rig was generated with PixelLab
`create_image_pixflux`, cleaned with a reference-preserving edit, and developed
into broken, partial, nearly operational, and complete states with a shared
inpaint mask. All raw states have zero pixel changes outside that mask and the
same alpha bounding box. Selected states use one identical lossless translation
to center them for gameplay.

In-app browser QA covered the new generated-asset path in a real 1920x1080 room:
idle, correct, wrong, stunned, working CSS fallback, winning, all four light-rig
progress mappings, score transitions at 0/1/10/15, results, and replay. Generated
states reported the PixelLab source, console logs were clean, and the complete
rig remained visible after the immediate score-15 results transition. The host
has no document overflow at exact 1280×720 or exact 1920×1080 viewport
measurements.
Controller content has no document overflow at exact 390×844, 360×800, or
390×667 measurements and keeps the complete A plus 1–4 stack visible in active,
stunned, lobby, and results states. Direct host and controller consoles were
free of errors and warnings. Temporary viewport QA wrappers were removed.

## Current presentation and architecture

Signal Sprint keeps the existing focused `SignalSprintGame` and protocol. No
server, shared-protocol, scoring, target, timing, tie, lifecycle, replay, or room
isolation code changed in this slice.

The host now renders a layered original CSS venue with one PixelLab-backed light
rig and one approved PixelLab service-robot master per participant. Identity is
redundant and fixed by player number: P1 red/circle, P2 blue/square, P3
yellow/triangle, and P4 green/diamond. Signal targets remain separate console
cues. The reusable robot exposes idle, input acknowledgement, correct, wrong,
stunned, working, winning, and losing presentation states.

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
image load errors also fall back to CSS. Every lane uses the same light-rig
design, with score-driven broken, partial, nearly operational, and complete
states. `VITE_SIGNAL_SPRINT_PIXELLAB_SPRITES=false` disables generated assets.

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

The initial candidates, two refinements, approved neutral prototype master, six
animation proofs, light-rig family, raw outputs, provenance, and supplied design
reference remain reviewable under `temp/pixellab/` and `docs/art-references/`.
Selected copies are now loaded from `apps/host/public/assets/pixellab/` by the
reversible presentation path. The CSS working/losing robot is visibly taller
and stylistically different from the PixelLab master; resolving that mismatch
requires a later human-approved art milestone. No new dependency, audio,
animation engine, generic minigame framework, tournament flow, persistence,
hosting, or deployment was introduced. Final name, identity, commercial
character art, accessibility standards, distribution, monetisation, engine
choice, and art/audio pipelines remain unresolved.
