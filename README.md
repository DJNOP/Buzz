# Local Multiplayer Party Game

> Working project description; the final game name and branding remain unresolved.

This repository contains an original shared-screen local multiplayer party-game prototype. Two to four players use phone browsers as simple controllers while the host runs in a desktop browser connected to a television or other shared display.

The product is intended to be family-friendly and still entertaining for adults with friends. It is neither specifically a children's game nor a drinking game. Alcohol is outside the product's branding, rules, scoring, and initial gameplay.

## Current state

Roadmap Milestones 1–5 are implemented:

- A real phone has successfully connected over local Wi-Fi and produced exactly one low-latency host event per deliberate primary-button press, including rapid presses.
- A host can create one temporary four-character room code.
- Two to four distinctly identified controllers can join the room.
- Each controller has one large primary action and four smaller labelled secondary controls.
- Every control sends typed `down` and `up` phases to only its own room's host.
- The host shows four player slots, connection state, latest input, valid-phase count, and diagnostic receipt time.
- Full rooms, invalid joins, duplicate names, disconnects, temporary reconnection, grace expiry, and host room closure are handled.

The current interface remains a technical visualizer. It contains no minigame, scoring, tournament flow, artwork, QR joining, matchmaking, accounts, database, or cloud service.

## Repository layout

```text
apps/
  controller/   React/Vite join flow and five-button phone controller
  host/         React/Vite room and player diagnostic display
  server/       Node.js/Socket.IO transport and in-memory room authority
packages/
  shared/       Typed room, player, session, and input protocol
scripts/
  dev.mjs                    Minimal multi-process development launcher
  smoke-multiplayer.mjs      Reproducible multiplayer smoke scenario
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

No formatter or linter is included. The current quality gates are strict TypeScript compilation, Vitest unit/integration tests, production builds, source-safety checks, and the smoke scenario.

## Run on the local network

1. Connect the computer and controllers to the same trusted private Wi-Fi or wired network.
2. In PowerShell at the repository root, run:

   ```powershell
   ipconfig
   ```

3. Under the active **Wireless LAN adapter Wi-Fi** or **Ethernet adapter**, note the `IPv4 Address`. Ignore disconnected, VPN, virtual-machine, and loopback adapters.
4. Start the server and both browser applications:

   ```powershell
   npm.cmd run dev
   ```

5. Open the host on the computer at [http://localhost:5173](http://localhost:5173), then select **Create room**.
6. On each controller device or isolated browser context, open `http://<computer-ip>:5174` and enter the host's code plus a unique short display name.
7. Stop the development stack with `Ctrl+C` when testing is finished.

The host, controller, and server use ports `5173`, `5174`, and `3001`. Browser clients derive the server hostname from the page URL, so no current machine IP is stored in source.

Windows Defender Firewall did not block the first successful real-phone test. On another machine or network, Windows may ask whether Node.js can accept connections; allow it only on **Private networks**. The project never changes firewall settings automatically.

## Automated multiplayer smoke test

With `npm.cmd run dev` already running in one PowerShell window, run this in a second window:

```powershell
npm.cmd run smoke
```

The scenario checks both browser pages, two room creations, two controllers in one room, all five buttons with paired phases, invalid-room rejection, four-player capacity, fifth-player rejection, cross-room isolation, controller replacement/reconnection, and host-triggered room closure.

## Manual multiplayer test

Use a combination of physical phones, different browsers, normal windows, and private/incognito windows. Each browser storage context represents one controller. Multiple normal tabs in the same browser profile share the same reconnection token, so use an incognito/private window, another browser profile, or another device for each additional simulated player.

1. Create a room on the host and confirm four empty numbered slots appear.
2. Join Player 1 from a phone using a unique display name.
3. Join Players 2–4 from other phones or isolated browser contexts.
4. Confirm every slot shows player number, name, accent marker, and connected state.
5. Attempt a fifth join and confirm the controller sees a friendly full-room message.
6. On every controller, press and hold each control, then release it. Confirm the host reports one `down` and one `up`, the correct semantic button, and the correct player.
7. Try simultaneous and rapid presses on different controllers. Confirm events stay in their room and counts remain consistent.
8. Reload one controller or briefly disable its network. The host should show it as disconnected, then restore the same number, name, accent, and player ID when it reconnects within 20 seconds.
9. Disconnect a controller for more than 20 seconds. Confirm its slot becomes empty and a new controller can use the freed number.
10. Close or reload the host. Connected controllers should be told that the room closed and return to the join screen; host reconnection is deliberately unsupported.

The reconnection token is a random, private prototype capability stored in that browser's local storage. It is not an account, authentication system, or durable session. Rooms and tokens disappear whenever the server restarts.

Screen Wake Lock remains deferred. Keep phone screens awake manually during longer tests.

## MVP direction

- The shared display remains the centre of attention; phone information stays minimal.
- The standard controller uses semantic identifiers `primary`, `secondary1`, `secondary2`, `secondary3`, and `secondary4`.
- Button colours are presentation configuration, not protocol identity; every secondary control also has a visible number and label.
- Player identity always includes player number and display name in addition to a temporary accent marker.
- QR joining, minigames, game engines, accounts, online matchmaking, native applications, analytics, advertising, and cloud infrastructure remain deferred.

## Documentation

- [Project status](PROJECT_STATUS.md) — current phase, completed milestones, next step, and known issues.
- [Product](docs/product.md) — product vision, experience principles, MVP boundaries, and originality requirements.
- [Architecture](docs/architecture.md) — room authority, transport boundaries, reconnection, cleanup, and protocol behaviour.
- [Roadmap](docs/roadmap.md) — ordered, evidence-driven milestones.
- [Decisions](docs/decisions.md) — accepted constraints and provisional technical decisions.
- [Open questions](docs/open-questions.md) — unresolved product, platform, accessibility, and production choices.
- [Agent guidance](AGENTS.md) — repository working rules for coding agents.

## Originality

The product must use original names, worlds, characters, assets, presentation, controller styling, and independently designed minigames. Existing game brands and their protected creative expression must not appear in or be copied by the product. The current controller uses temporary original styling and a two-by-two secondary layout; its final palette, shapes, arrangement, and terminology remain open product decisions.
