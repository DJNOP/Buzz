# Local Multiplayer Party Game

> Working project description; the final game name and branding remain unresolved.

This repository contains an original shared-screen local multiplayer party-game prototype. Two to four players use phone browsers as simple controllers while the host runs in a desktop browser connected to a television or other shared display.

The product is intended to be family-friendly and still entertaining for adults with friends. It is neither specifically a children's game nor a drinking game. Alcohol is outside the product's branding, rules, scoring, and initial gameplay.

## Current state

Roadmap Milestones 1–7 and a provisional themed presentation slice are implemented:

- A real phone successfully connected over local Wi-Fi and produced exactly one low-latency host event per deliberate primary-button press, including rapid presses.
- A host creates one temporary four-character room code for up to four distinctly identified controllers.
- Every controller has one large primary action and four smaller labelled secondary controls.
- Typed `down` and `up` phases reach only the controller's own room host.
- Capacity, invalid joins, duplicate names, disconnection, 20-second reconnection, grace expiry, isolation, and host closure are handled.
- The host detects suitable local IPv4 addresses and generates a local SVG QR code containing a controller URL and the room code.
- A scanned controller link prefills the room code but still requires a display name and server-validated join.
- Manual room-code entry remains fully supported.
- Signal Sprint provides one primitive server-authoritative validation game with
  a lobby, three-second countdown, 30-second round, results, replay, and return
  to lobby.
- Correct five-button matches score and advance a geometric marker; wrong
  matches record a mistake and cause a 600 ms server-authoritative stun.
- The first player to 15 wins immediately. Otherwise the highest score wins at
  the time limit, including explicit joint winners for ties.
- Players retain round state through temporary reconnection, late joiners wait
  for the next round, and expired participants become inactive for that round.
- Signal Sprint now takes place in an original temporary Event Rescue venue.
  One reusable CSS service robot works at each player's operational station;
  P1 is red/circle, P2 blue/square, P3 yellow/triangle, and P4 green/diamond.
- The host acknowledges every accepted server-received controller down, while
  correct, wrong, stunned, working, winning, and losing presentation remains
  derived from authoritative game snapshots.
- Joined phones use a vertical no-scroll layout: a large round A followed by
  full-width 1 RED, 2 BLUE, 3 YELLOW, and 4 GREEN controls.

Signal Sprint and its Event Rescue world are provisional prototype content used
to validate the shared-screen gameplay loop. They are not final branding,
production artwork, or an approved production minigame. The
project still contains no tournament flow, external artwork, audio production,
game engine, progression, matchmaking, accounts, database, deployment, or cloud
service.

## Repository layout

```text
apps/
  controller/   React/Vite join flow, vertical fixed controls, and round status
  host/         React/Vite QR lobby, venue, robots, stations, and game screen
  server/       Socket.IO transport, room lifecycle, LAN discovery, and game rules
packages/
  shared/       Typed room/game protocol plus controller join-URL/query utilities
scripts/
  dev.mjs                    Minimal multi-process development launcher
  smoke-multiplayer.mjs      Reproducible QR and multiplayer smoke scenario
```

The root uses native npm workspaces without a monorepo orchestration framework.

## Install and validate

The installed Vite version requires Node.js `^20.19.0` or `>=22.12.0`. The project was most recently validated with Node.js `v24.15.0` and npm `11.12.1`.

On Windows PowerShell, use `npm.cmd` because the machine's execution policy may block the `npm.ps1` launcher:

```powershell
npm.cmd install
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

No formatter or linter is included. The current quality gates are strict
TypeScript compilation, 71 Vitest unit/integration tests, production builds,
source-safety checks, browser QA, and the smoke scenario.

The host uses `qrcode.react` 4.2.0, a focused zero-dependency React renderer with built-in TypeScript declarations. It renders the join QR locally as SVG; no room code, URL, or other data is sent to a QR service.

## Run on the local network

1. Connect the computer and controllers to the same trusted private Wi-Fi or wired network.
2. At the repository root, start the server and both browser applications:

   ```powershell
   npm.cmd run dev
   ```

3. Open the host at [http://localhost:5173](http://localhost:5173) and select **Create room**.
4. Scan the displayed QR code with a phone camera, enter a display name, and join.
5. If several addresses are detected, use the host's selector to try the address associated with the shared local network.
6. As a fallback, open `http://<computer-ip>:5174` manually and enter the prominent room code.
7. Stop the development stack with `Ctrl+C` when testing is finished.

The host, controller, and server use ports `5173`, `5174`, and `3001`. Address discovery reads active Node.js network-interface data; it does not assume Wi-Fi, hard-code this computer's IP address, or change firewall/network settings.

Windows Defender Firewall did not block the first successful real-phone test. On another machine or network, Windows may ask whether Node.js can accept connections; allow it only on **Private networks**.

## Automated multiplayer smoke test

With `npm.cmd run dev` already running in one PowerShell window, run this in a second window:

```powershell
npm.cmd run smoke
```

The scenario checks both pages, detected address delivery, controller URL
construction, QR-prefilled and manual joining, invalid/full joins, all five
paired controls, two-room isolation, and reconnection. It then starts Signal
Sprint with two controllers, enforces a wrong-input stun, rejects input during
the stun, reaches the 15-point win condition, replays without reconnecting,
keeps a second game room isolated, and verifies host-triggered cleanup.

## Play Signal Sprint

1. Start the stack with `npm.cmd run dev`, open the host, and create a room.
2. Join one to four controllers by QR code or manual room code. Two to four is
   the intended social experience; one player remains available for development.
3. Select **Start Signal Sprint**. Players connected when the three-second
   countdown begins participate in that round.
4. During the 30-second race, watch only the shared host screen and press the
   controller button matching your station's current cue.
5. A correct press scores one completed job and advances the station's
   operational meter. A wrong press records a misroute and briefly stuns that
   service robot and controller.
6. The first player to 15 ends the round. If time expires, the highest score
   wins and equal leaders are joint winners.
7. Select **Play again** to capture the currently connected roster for another
   round, or **Return to lobby** to show the QR and room code again. Neither
   action recreates the room or requires controllers to rejoin.

## Manual QR acceptance test

1. Start the development stack with `npm.cmd run dev`.
2. Open [http://localhost:5173](http://localhost:5173) and create a room.
3. Scan the host QR code with an iPhone or Android camera.
4. Confirm the controller page opens at the displayed local URL.
5. Confirm the room code is prefilled and the display-name field is prioritized.
6. Enter a unique name, join, and confirm the correct host player slot appears.
7. Press every control and confirm the host reports the correct player, semantic button, `down`, and `up`.
8. Open the controller page manually on another device/context and join using only the room code.
9. If the host shows several detected addresses, select each plausible local address and confirm the QR and displayed URL update; use the one shared by the phone's network.
10. Disable Wi-Fi on the phone or connect it to another network and scan again. Confirm joining fails as a network reachability issue, then return both devices to the same network. Cross-network and internet joining are not supported.

Real-camera scanning is the remaining acceptance test. Do not treat automated QR rendering or browser navigation as proof that every camera, display distance, guest network, VPN, or firewall configuration works.

## Manual multiplayer and reconnection checks

Use separate physical devices, browser profiles, or private/incognito contexts for additional simulated players. Normal tabs in one browser profile share the same private reconnection token.

1. Join Players 1–4 and confirm every numbered slot, name, accent, and connection state.
2. Attempt a fifth join and confirm the friendly full-room message.
3. Try simultaneous and rapid presses on different controllers and confirm counts remain isolated.
4. Reload or briefly disable one controller's network and confirm restoration to the same identity within 20 seconds.
5. Disconnect for more than 20 seconds and confirm the slot becomes available.
6. Close or reload the host and confirm controllers return to joining with a room-closed notice.

The reconnection token is a random private capability stored in that browser's local storage. It is not included in QR links, is not an account or authentication system, and disappears with the in-memory room whenever the server restarts.

Screen Wake Lock remains deferred. Keep phone screens awake manually during longer tests.

## Manual Signal Sprint playtest

1. Connect the host to a television at 1280×720 or 1920×1080 and start the
   development stack.
2. Create a room and join two to four physical phones, using both QR and manual
   room-code joining at least once.
3. Start Signal Sprint and confirm every player sees the same 3, 2, 1 countdown
   on the television while phones show only **Get ready**.
4. Confirm each station has the correct player name/number, colour/shape robot
   identity, readable cue, job score, operational meter, and misroute count.
5. Press each player's matching button and confirm exactly one job, one meter
   step, a changed cue, visible acknowledgement, and no target disclosure on
   the phone.
6. Deliberately press a wrong button and confirm the host shows wrong/stun
   feedback, the phone briefly reports **Stunned**, and rapid presses during the
   stun do not score.
7. Reload one participating phone during the round and confirm its player,
   score, and target return within the 20-second grace period.
8. Join another controller after the round begins and confirm it is told to wait
   and joins the next replay rather than the current round.
9. Let one round expire to verify highest-score and joint-winner results, then
   complete another by reaching 15.
10. Select **Play again** and verify everyone continues without rejoining; then
    select **Return to lobby** and verify the QR, manual code, and membership are
    preserved.

Technical validation does not establish whether Signal Sprint is enjoyable,
socially clear, or worth polishing. Record observations from this physical
two-to-four-player playtest before adding another minigame or a tournament flow.

## MVP direction

- The shared display remains the centre of attention; phone information stays minimal.
- The standard controller uses semantic identifiers `primary`, `secondary1`, `secondary2`, `secondary3`, and `secondary4`.
- The current presentation maps them to A, 1 RED, 2 BLUE, 3 YELLOW, and 4
  GREEN. Controls and players never rely on colour alone.
- Local QR joining and short manual room codes coexist.
- Signal Sprint remains a deliberately small rules module. Its Event Rescue
  venue and robots are frontend presentation, not a general minigame framework
  or final product-content commitment.
- Additional minigames, tournament flow, game engines, internet hosting,
  accounts, matchmaking, native applications, analytics, advertising, and cloud
  infrastructure remain deferred.

## Documentation

- [Project status](PROJECT_STATUS.md) — current phase, completed milestones, next step, and known issues.
- [Product](docs/product.md) — product vision, experience principles, MVP boundaries, and originality requirements.
- [Architecture](docs/architecture.md) — authority, address discovery, QR construction, reconnection, and protocol behaviour.
- [Roadmap](docs/roadmap.md) — ordered, evidence-driven milestones.
- [Decisions](docs/decisions.md) — accepted constraints and provisional technical decisions.
- [Open questions](docs/open-questions.md) — unresolved product, platform, accessibility, and production choices.
- [Agent guidance](AGENTS.md) — repository working rules for coding agents.

## Originality

The product must use original names, worlds, characters, assets, presentation, controller styling, and independently designed minigames. Existing game brands and their protected creative expression must not appear in or be copied by the product. The QR panel uses a neutral, unbranded presentation without decorative overlays that could reduce scan reliability.
