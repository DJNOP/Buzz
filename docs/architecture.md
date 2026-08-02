# Provisional Architecture

## Status

This is an implemented but still provisional local-network architecture. The first real-phone input test passed, and the multiplayer room foundation is automated-test and local-smoke validated. Real multi-device controller ergonomics still need manual evaluation before expanding scope.

## Workspace boundaries

1. **Host (`apps/host`)** — React/Vite shared-screen room creation and four-slot diagnostics.
2. **Controller (`apps/controller`)** — React/Vite join form, private reconnection storage, player identity, and five-button input capture.
3. **Server (`apps/server`)** — Socket.IO transport plus the in-memory authoritative `RoomManager`.
4. **Shared protocol (`packages/shared`)** — event names, acknowledgements, public room/player/session types, semantic buttons/phases, constants, normalization, and runtime validation.

There is no game-logic package because this milestone contains no game state, rules, scoring, or minigame.

## Authoritative state

`RoomManager` is the only authoritative source for:

- room code and owning host socket;
- player ID, number, normalized display name, and temporary accent;
- current controller socket and connected/disconnected state;
- private reconnection token and grace timer;
- currently pressed semantic buttons;
- per-player valid input count and latest accepted diagnostic input.

The host keeps a presentation copy of public room snapshots and applies ordered host-input events for immediate display. The controller stores only its private reconnection token and last room code in local storage. Neither browser can assign trusted player or room identity.

## Room lifecycle

1. A connected host requests one room.
2. The server generates a four-character uppercase code from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, retrying collisions up to a bounded limit.
3. Controllers submit a normalized room code and server-validated 1–16 character display name.
4. The server rejects malformed/nonexistent rooms, invalid or case-insensitive duplicate names, already-joined sockets, and capacity beyond four.
5. The lowest free player number is assigned with a random UUID, semantic accent, and 256-bit random base64url reconnection token.
6. Public room snapshots never contain reconnection tokens.
7. When the host disconnects, all player timers and indexes are cleared, connected controllers receive a room-closed notice, and the room is removed immediately.

Rooms, players, and tokens remain in memory because local rapid prototyping does not require persistence, cross-process coordination, accounts, or recovery after a server restart.

## Controller reconnection

- On disconnect, the server removes the socket association, clears active-button state, marks the player disconnected, and reserves the slot for 20 seconds.
- A new Socket.IO connection may present the private token once to restore the same player ID, number, name, and accent.
- Successful restoration cancels the expiry timer and atomically replaces any old socket mapping before the old socket is disconnected.
- Invalid, expired, room-closed, or server-restart tokens are rejected with a user-facing message.
- At grace expiry, the disconnected player and token are removed and the number becomes available.

The token is a temporary bearer capability, not authentication. It is never logged, sent to a host, or exposed to other controllers.

## Input protocol

The network protocol uses semantic buttons:

- `primary`
- `secondary1`
- `secondary2`
- `secondary3`
- `secondary4`

Each input contains only button, `down`/`up` phase, and client timestamp. The server derives the player and room from its socket-to-player index, rejects malformed values, unjoined or removed sockets, host impersonation, repeated `down`, and unmatched `up`, then sends a host diagnostic event only to that room's host socket.

Button colours, symbols, and labels are frontend presentation. Player accents are a separate identity marker, and number/name remain visible so neither buttons nor players rely on colour alone.

The controller input tracker owns pointer IDs and active keyboard controls. It prevents compatibility-click duplicates, emits one paired `down`/`up`, releases on pointer cancellation/lost capture/blur/visibility loss, and supports keyboard or assistive activation where practical.

## Local-network addressing

- Socket.IO server: `0.0.0.0:3001`
- Host Vite server: `0.0.0.0:5173`
- Controller Vite server: `0.0.0.0:5174`

Both browsers derive the Socket.IO hostname from `window.location.hostname`, with an optional `VITE_SERVER_URL` development override. No machine-specific IP is committed.

## Cleanup and race handling

- Room-code collisions are retried rather than assumed impossible.
- Player IDs are checked across all active rooms; reconnection-token collisions are retried.
- Every disconnected-player timer is cancelled on reconnection, host closure, or manager disposal.
- Late timer callbacks safely no-op if their room/player no longer exists or reconnected.
- Reconnection removes the previous socket index before the previous socket is disconnected, so its late disconnect/input cannot evict or impersonate the restored session.
- Disconnected slots count toward four-player capacity until expiry.

## Validation coverage

Automated coverage includes room creation/code format/collisions, join/name/capacity rules, stable numbering, token secrecy, disconnect/reconnect/expiry, host closure, paired input state, malformed/unjoined/removed/host input rejection, cross-room isolation, pointer cancellation/focus loss, and compile-time shared contracts.

The reproducible smoke scenario verifies both browser pages plus two rooms, multiple controllers, all five paired controls, invalid/full joins, isolation, replacement reconnection, and host-triggered closure.

## Deliberately deferred

QR joining, host reconnection, durable storage, accounts/authentication, matchmaking, internet hosting/security, native apps, smart-TV apps, game engines, scoring, tournament flow, minigames, artwork, analytics, advertising, and deployment remain outside this foundation.
