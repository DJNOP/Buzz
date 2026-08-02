# Provisional Architecture

## Status

This is an implemented but still provisional local-network architecture. The first real-phone input test passed, and the multiplayer plus QR-joining foundations are automated-test, smoke, build, and browser validated. Real multi-device ergonomics and real-camera QR scanning still require manual acceptance before expanding scope.

## Workspace boundaries

1. **Host (`apps/host`)** — React/Vite room creation, local SVG QR rendering, address choice, and four-slot diagnostics.
2. **Controller (`apps/controller`)** — React/Vite URL-prefilled/manual join form, private reconnection storage, player identity, and five-button capture.
3. **Server (`apps/server`)** — Socket.IO transport, the authoritative in-memory `RoomManager`, and read-only network-interface discovery.
4. **Shared protocol (`packages/shared`)** — typed events, acknowledgements, public room/player/session types, semantic controls, validation, and controller join-URL/query utilities.

There is no game-logic package because this milestone contains no game state, rules, scoring, or minigame.

## Authoritative room state

`RoomManager` remains the only authoritative source for:

- room code and owning host socket;
- player ID, number, normalized display name, and temporary accent;
- current controller socket and connected/disconnected state;
- private reconnection token and grace timer;
- currently pressed semantic buttons;
- per-player valid input count and latest accepted diagnostic input.

QR generation and address discovery do not change room authority. The server still derives trusted player and room identity from the joined socket, and it validates every join regardless of where the room code originated.

## Room lifecycle and reconnection

1. A connected host requests one room.
2. The server generates a collision-checked four-character code from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`.
3. Controllers submit a normalized code and server-validated 1–16 character display name.
4. Invalid/nonexistent rooms, duplicate names, already-joined sockets, and capacity beyond four are rejected.
5. The lowest free player number receives a random UUID, semantic accent, and 256-bit random base64url reconnection token.
6. Public room snapshots and controller join URLs never contain reconnection tokens.
7. Controller disconnects reserve the identity for 20 seconds; successful restoration cancels expiry and atomically replaces the previous socket.
8. Host disconnect immediately removes the room, timers, indexes, and tokens and notifies connected controllers.

Rooms and tokens remain in memory and disappear on server restart.

## Local network address discovery

`apps/server/src/network-address.ts` is independent of React and `RoomManager`. It accepts injected interface fixtures for tests and uses Node.js `os.networkInterfaces()` in production.

Discovery:

- accepts IPv4 entries only;
- rejects entries marked internal;
- independently excludes loopback, unspecified, link-local, multicast/reserved, malformed, and unusable addresses;
- deduplicates addresses across interfaces;
- prefers common private ranges in deterministic order: `192.168/16`, `10/8`, then `172.16/12`;
- retains other usable non-internal IPv4 addresses as lower-priority candidates;
- does not assume Wi-Fi, Ethernet, or specific adapter names; and
- safely returns an empty list when no candidate exists.

A validated host-role socket explicitly requests this minimal list through `host:get-network-addresses`. Controller-role sockets cannot read it. These transient roles are routing boundaries, not user authentication. The host chooses the first candidate by default and shows a selector only when multiple addresses exist. Listing alternatives avoids treating a likely VPN or virtual-adapter address as unquestionably correct, but automatic adapter classification remains deliberately provisional.

## QR joining

The host constructs `http://<selected-ip>:5174/?room=<ROOM_CODE>` with the shared `buildControllerJoinUrl` utility and `URLSearchParams`. The room value is encoded rather than interpolated into query text.

`qrcode.react` 4.2.0 renders that URL locally as responsive SVG with a four-module quiet margin, dark modules, a white background, and no decorative overlay. The package is focused, typed, ISC-licensed, and has no runtime dependencies. No external QR service, analytics request, room code, URL, private token, or other data leaves the local application for QR generation.

The host keeps the room code prominent, shows the complete underlying link, offers copy feedback, explains the same-network requirement, and provides a manual fallback when detection returns no address.

## Controller URL handling

The shared `parseRoomQuery` utility reads exactly one `room` parameter, normalizes it with the same room-code rules used for manual entry, and returns `missing`, `valid`, or `invalid` rather than trusting raw query text.

- A valid query prefills the room field and prioritizes the name input.
- The controller never auto-joins; a display name and server acknowledgement remain required.
- An invalid or repeated parameter produces non-technical fallback guidance.
- A missing parameter leaves the existing manual flow unchanged.
- After successful joining or token restoration, only the consumed `room` parameter is removed with `history.replaceState`.
- Existing token restoration takes priority when a current browser session can be recovered.

## Input protocol

The network protocol continues to use `primary`, `secondary1`, `secondary2`, `secondary3`, and `secondary4` with `down`/`up` phases and a client timestamp. The server rejects malformed values, unjoined/expired sockets, host impersonation, repeated `down`, and unmatched `up`, then routes accepted input only to the owning host.

Button colour, symbol, and label remain frontend presentation. The controller prevents compatibility-click duplicates, releases inputs on cancellation/focus/visibility loss, and supports keyboard or assistive activation where practical.

## Local endpoints

- Socket.IO server: `0.0.0.0:3001`
- Host Vite server: `0.0.0.0:5173`
- Controller Vite server: `0.0.0.0:5174`

Both browser clients derive the Socket.IO hostname from `window.location.hostname`, with an optional `VITE_SERVER_URL` development override. No current machine address is stored in production source.

## Validation coverage

Automated coverage includes interface filtering, private-address preference, deduplication, deterministic ordering, empty discovery, host-only address delivery, URL construction/encoding, room-query normalization/rejection/missing state, room creation, join/name/capacity rules, token secrecy, reconnect expiry/races, host closure, paired input, malformed/unjoined/host rejection, isolation, pointer cancellation, and compile-time event contracts.

The smoke scenario verifies address delivery on the running machine, a generated controller link, the controller query route, parsed prefill, invalid/missing queries, QR-style and manual joins, all five paired controls, capacity, isolation, reconnection, and host closure.

Browser QA covered a 1280×720 host, true 390×844 and 360×800 controller viewports, query consumption, invalid-link guidance, copy feedback, input routing, and application console warnings/errors. Real-camera scanning remains manual.

## Deliberately deferred

Real-camera acceptance aside, host reconnection, durable storage, accounts/authentication, matchmaking, internet hosting/security, native apps, smart-TV apps, game engines, scoring, tournament flow, minigames, artwork, analytics, advertising, and deployment remain outside this foundation.
