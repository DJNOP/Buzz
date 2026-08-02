# Provisional Architecture

## Status

This is an implemented but provisional local-network architecture. Room,
controller, reconnection, QR joining, and the first primitive Signal Sprint
minigame are automated-test, build, smoke, and browser validated. Physical
two-to-four-player enjoyment and ergonomics remain unvalidated.

## Workspace boundaries

1. **Host (`apps/host`)** — React/Vite QR lobby plus the shared countdown,
   player lanes, targets, timing display, feedback, and results screen.
2. **Controller (`apps/controller`)** — React/Vite QR/manual join, private
   reconnection storage, fixed five-button input, and minimal round status.
3. **Server (`apps/server`)** — Socket.IO transport, authoritative
   `RoomManager`, per-room `SignalSprintGame` rules, and read-only local-network
   discovery.
4. **Shared protocol (`packages/shared`)** — typed room/game events,
   acknowledgements, public state, validation, controls, and controller
   join-URL/query utilities.

Signal Sprint remains a focused server module rather than a new workspace or a
general-purpose minigame/plugin framework. No game engine is used.

## Authoritative room state

`RoomManager` remains the only authority for:

- room code and owning host socket;
- player ID, number, display name, accent, controller socket, and connection;
- private reconnection token and 20-second grace timer;
- active-button pairing and accepted semantic controller input; and
- room capacity, player expiry, and host-triggered closure.

Every input is associated with its trusted room and player from the server's
socket indexes. Clients never submit trusted room identity, player identity,
score, target, phase, or timing. Public room/game snapshots and QR links never
contain reconnection tokens.

## Signal Sprint game state

Each created room receives one `SignalSprintGame` instance. It owns only the
current validation game's rules and state:

- explicit `lobby`, `countdown`, `playing`, and `results` phases;
- monotonically increasing numeric round identifier;
- participants captured from connected room players at countdown start;
- one five-button target, score, mistake count, connection/inactive state,
  stun expiry, and latest feedback per participant;
- authoritative countdown and round deadlines; and
- final winner player IDs, including every tied highest scorer at timeout.

The game accepts injected clock, scheduler, cancellation, random, and duration
options. Unit tests therefore advance fake time without real three- or
30-second delays. Production defaults are a three-second countdown, 30-second
round, 600 ms stun, and 15-point early-win threshold.

Correct `down` input scores once, advances the target without immediately
repeating it when alternatives exist, and ends the round at 15. Wrong `down`
records one mistake and schedules stun expiry. `up`, malformed/unpaired/repeated
input, input outside play, unknown/nonparticipating input, disconnected or
inactive participants, and input during stun cannot score. The existing
`RoomManager` down/up pairing rejects repeated physical downs before game rules
run.

Only host-role sockets may request `start`, `replay`, or `return_to_lobby` via a
single typed game-action event. The request contains only the action; the server
derives its room from the host socket. Full game state, including targets and
results, is emitted only to that room's host. Each connected controller receives
a separate coarse status containing only phase/participation plus stun expiry
when relevant—never target, score, winners, or a reconnection token.

## Player and timer lifecycle

Room snapshots synchronise participant connection state with the per-room game:

1. Players connected when countdown begins become participants.
2. Controllers joining during countdown or play remain valid room members but
   receive `waiting_next_round` and are absent from current lanes.
3. A disconnected participant retains game state while `RoomManager` reserves
   the player. Successful token restoration reconnects the same player without
   changing score or target.
4. When the room slot expires, its absent participant becomes `inactive` for
   the remainder of the round. A new player using the freed number is still a
   distinct nonparticipant until replay.
5. Replay captures the currently connected roster and resets scores, mistakes,
   targets, stuns, winners, and deadlines without recreating the room.
6. Return to lobby clears round presentation while keeping controllers joined.
7. Host disconnection closes the room, notifies controllers, disposes game
   phase/stun timers, and removes every game/room index. Host reconnection is not
   supported.

Round-ID and phase checks make stale phase/stun callbacks harmless. Game
disposal cancels all scheduled handles, avoiding races with room closure.

## Joining and local network discovery

`apps/server/src/network-address.ts` accepts injected interface fixtures and
uses `os.networkInterfaces()` in production. It accepts usable non-internal IPv4
entries, excludes internal/loopback/link-local/reserved/malformed ranges,
deduplicates candidates, and orders common private ranges first without relying
on adapter names. Multiple candidates remain user-selectable because VPN and
virtual-adapter classification is provisional.

The host constructs `http://<selected-ip>:5174/?room=<ROOM_CODE>` with shared URL
utilities. `qrcode.react` 4.2.0 renders a local SVG with quiet margin and no
overlay or third-party request. The query contains only the room code, never a
reconnection token. Controller parsing normalises and validates exactly one
`room` value, prefills without auto-joining, preserves manual entry, and removes
the consumed parameter after successful join/restoration.

Joining information remains visible only in the lobby. Replay and return to
lobby preserve the same room, QR, address choice, and controller membership.

## Controller input and presentation

The fixed protocol uses `primary`, `secondary1`, `secondary2`, `secondary3`, and
`secondary4` with paired `down`/`up` phases. The controller keeps pointer
capture, cancellation/focus/visibility release, keyboard/assistive activation,
compatibility-click suppression, haptics where supported, reconnection storage,
and QR/manual joining.

Controls are logically disabled unless controller status is `round_active`.
The phone shows lobby, get-ready, active, stunned, next-round, or results copy
only and directs attention to the shared display. All targets and gameplay
instructions that matter moment to moment remain on the host.

The host uses React and CSS geometric shapes for targets, per-player markers,
tracks, feedback, and results. There is no canvas engine, artwork, audio, or
external asset.

## Local endpoints

- Socket.IO server: `0.0.0.0:3001`
- Host Vite server: `0.0.0.0:5173`
- Controller Vite server: `0.0.0.0:5174`

Clients derive the Socket.IO hostname from the page, with an optional
`VITE_SERVER_URL` development override. No machine-specific address belongs in
source control.

## Validation coverage

Automated coverage includes prior room, input, reconnection, network-address,
QR URL/query, and protocol behavior plus Signal Sprint phase guards, roster
capture, countdown/round timing, correct/wrong/up input, stun enforcement,
target changes, duplicate prevention, 15-point completion, timeout winners and
ties, cross-room isolation, reconnect preservation, expiry inactivation, late
joins, replay/lobby membership, and timer cleanup.

The live smoke scenario uses the production game durations and validates two
rooms, QR/manual joins, independent targets, correct/wrong inputs, stun, early
win, results, replay, mid-round reconnect, isolation, and host closure. Browser
QA covers 1280×720, scaled true 1920×1080, 390×844, 360×800, and 390×667 layouts.

## Deliberately deferred

Signal Sprint is not final product content. Physical enjoyment testing,
tournament flow, additional minigames, a generic game framework, game-engine
selection, polished art/audio, host reconnection, persistence, accounts,
matchmaking, internet hosting/security, native apps, smart-TV apps, analytics,
advertising, and deployment remain outside this milestone.
