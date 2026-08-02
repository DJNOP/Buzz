# Project Status

- **Current phase:** Primitive playable-minigame technical validation
- **Current milestone:** Roadmap Milestones 1–7 implemented
- **Last completed task:** Added the first server-authoritative Signal Sprint
  prototype with a lobby, countdown, timed race, scoring, stuns, results,
  replay, lifecycle handling, and TV/phone presentation.
- **Next recommended task:** Run the documented physical two-to-four-player
  Signal Sprint enjoyment and ergonomics playtest before adding content or a
  tournament flow.
- **Date last updated:** 2026-08-02

## Validation summary

The local-network room, five-button controller, reconnection, QR-prefill, and
manual join foundations remain intact. Signal Sprint passes strict type checking
for every workspace and 64 automated tests: 4 controller, 52 server, and 8
shared-protocol/query tests. The test suite uses fake timers for game rules and
contains no real countdown or round delay.

The live multiplayer smoke scenario passed with real three-second and 30-second
timer configuration. It covered QR-style and manual joins, two controllers,
independent targets, correct/wrong inputs, 600 ms stun enforcement, ignored stun
input, a 15-point early win, replay without reconnecting, a second isolated room,
mid-round reconnection, and host cleanup.

In-app browser QA covered the lobby, countdown, one- and four-player active
layouts, results/replay, and clean direct application consoles. The host fit
1280×720 without page or lane overflow and a scaled true 1920×1080 iframe showed
the full lobby. Controller content fit true 390×844, 360×800, and shorter
390×667 iframe viewports. Replay returned the connected controller to active
status without showing the join form. Physical multiplayer enjoyment has not
been tested in this milestone.

## Current architecture summary

The npm-workspaces TypeScript system keeps React/Vite host and controller apps,
the Node.js/Socket.IO server, and shared protocol types separate. `RoomManager`
still owns rooms, trusted socket/player identity, input pairing, capacity,
reconnection, and expiry.

One `SignalSprintGame` instance per room separately owns the phase, round ID,
captured participants, targets, scores, mistakes, stun expiry, countdown and
round deadlines, and winners. The module has injected clock, scheduler, and
random sources for deterministic tests. Socket handlers only route trusted host
actions, accepted controller inputs, room lifecycle snapshots, and public game
updates; clients cannot submit scores, targets, timing, room identity, or player
identity.

The host alone receives targets and complete game state. Controllers receive
only coarse lobby/get-ready/active/stunned/waiting/results status, and buttons
are disabled outside an active, non-stunned round. No game engine, generic
minigame framework, persistence, external artwork, or new dependency was added.

## Lifecycle behaviour

- Connected players are captured when countdown begins; one player is allowed
  for development while two to four remains the intended social experience.
- Reconnecting participants retain score and target during the existing grace
  period. Expired participants remain inactive in the current round.
- Late joiners enter the room but wait for the next replay.
- Replay resets round state while preserving membership; return-to-lobby also
  preserves the room and QR/manual joining information.
- Host disconnection closes the room and disposes phase and stun timers.

## Remaining risks and manual validation

Signal Sprint is a provisional validation game, not final product content or
branding. Automated correctness and readable browser layouts do not establish
fun, social clarity, camera-to-TV viewing comfort, controller ergonomics,
accessibility, perceived latency with four physical phones, or whether players
want another round. These are the acceptance questions for the next physical
playtest.

Final name, visual identity, final controller presentation, tournament design,
accessibility standards, distribution, monetisation, engine choice, art/audio
pipelines, and long-term network-adapter handling remain unresolved. Screen Wake
Lock, host reconnection, persistence, internet hosting, accounts, additional
minigames, and production infrastructure remain deferred.
