# Local Multiplayer Party Game

> Working project description; the final game name and branding remain unresolved.

This repository contains an original shared-screen local multiplayer party-game prototype. Two to four players use phone browsers as simple controllers while the host runs in a desktop browser connected to a television or other shared display.

The product is intended to be family-friendly and still entertaining for adults with friends. It is neither specifically a children's game nor a drinking game. Alcohol is outside the product's branding, rules, scoring, and initial gameplay.

## Current state

Roadmap Milestones 1–6 are implemented:

- A real phone successfully connected over local Wi-Fi and produced exactly one low-latency host event per deliberate primary-button press, including rapid presses.
- A host creates one temporary four-character room code for up to four distinctly identified controllers.
- Every controller has one large primary action and four smaller labelled secondary controls.
- Typed `down` and `up` phases reach only the controller's own room host.
- Capacity, invalid joins, duplicate names, disconnection, 20-second reconnection, grace expiry, isolation, and host closure are handled.
- The host detects suitable local IPv4 addresses and generates a local SVG QR code containing a controller URL and the room code.
- A scanned controller link prefills the room code but still requires a display name and server-validated join.
- Manual room-code entry remains fully supported.

The current interface remains a technical visualizer. It contains no minigame, scoring, tournament flow, artwork, matchmaking, accounts, database, deployment, or cloud service.

## Repository layout

```text
apps/
  controller/   React/Vite URL-prefilled join flow and five-button controller
  host/         React/Vite QR join panel and four-player diagnostic display
  server/       Socket.IO room transport and testable LAN address discovery
packages/
  shared/       Typed protocol plus controller join-URL/query utilities
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

No formatter or linter is included. The current quality gates are strict TypeScript compilation, Vitest unit/integration tests, production builds, source-safety checks, browser QA, and the smoke scenario.

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

The scenario checks both pages, detected address delivery, controller URL construction, the query route, QR-prefilled and manual joining, invalid queries, two rooms, all five paired controls, invalid/full joins, cross-room isolation, controller reconnection, and host-triggered closure.

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

## MVP direction

- The shared display remains the centre of attention; phone information stays minimal.
- The standard controller uses semantic identifiers `primary`, `secondary1`, `secondary2`, `secondary3`, and `secondary4`.
- Button colours remain presentation configuration; controls and players never rely on colour alone.
- Local QR joining and short manual room codes coexist.
- Internet hosting, minigames, game engines, accounts, online matchmaking, native applications, analytics, advertising, and cloud infrastructure remain deferred.

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
