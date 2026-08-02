# Local Multiplayer Party Game

> Working project description; the final game name and branding are intentionally unresolved.

This repository is the foundation for an original shared-screen local multiplayer party game. Two to four players will use phone browsers as simple controllers while the main game runs in a desktop browser connected to a television or other shared display.

The game is intended to deliver short, accessible, competitive minigames that are family-friendly and still entertaining for adults playing with friends. It is neither specifically a children's game nor a drinking game. Alcohol is outside the product's branding, rules, scoring, and initial gameplay.

## Current state

The repository now contains the first end-to-end technical slice: one controller browser connects to one host browser through a local Socket.IO server, and one primary-button press creates immediate geometric feedback on the host. The host shows a press count and receipt timestamps for diagnostics.

The implementation and automated/local smoke validation for Roadmap Milestones 1 and 2 are complete. A real phone-on-private-network test still needs to be performed before treating those milestones as fully validated or starting the five-button milestone.

## Repository layout

```text
apps/
  controller/   React/Vite phone controller
  host/         React/Vite shared-screen host
  server/       Node.js/Socket.IO real-time server
packages/
  shared/       Typed Socket.IO events and runtime payload validation
scripts/
  dev.mjs       Minimal multi-process development launcher
```

The root uses npm workspaces. No monorepo orchestration framework is required.

## Install and validate

The installed Vite version requires Node.js `^20.19.0` or `>=22.12.0`. This prototype was created with Node.js `v24.15.0`, npm `11.12.1`, and Git `2.47.1.windows.1`.

On Windows PowerShell, use `npm.cmd` because the machine's execution policy may block the `npm.ps1` launcher:

```powershell
npm.cmd install
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

No formatter or linter is included at this milestone; the current checks are TypeScript, Vitest, production builds, and the manual smoke path below.

## Run on the local network

1. Connect the computer and phone to the same trusted private Wi-Fi or wired network.
2. In PowerShell at the repository root, determine the computer's local address:

   ```powershell
   ipconfig
   ```

   Under the active **Wireless LAN adapter Wi-Fi** or **Ethernet adapter**, note the `IPv4 Address`, such as `<computer-ip>`. Ignore disconnected, VPN, virtual-machine, and loopback adapters.

3. Start all three development processes:

   ```powershell
   npm.cmd run dev
   ```

4. On the computer, open the host at [http://localhost:5173](http://localhost:5173).
5. On the phone, open `http://<computer-ip>:5174`, replacing `<computer-ip>` with the address from `ipconfig`.
6. Wait until both pages say they are connected, then press the phone's large **Press** button. The host shape should flash, the counter should increase by exactly one, and both receipt times should update.
7. Stop the development processes with `Ctrl+C` in PowerShell.

Both browser clients derive the Socket.IO server address from the hostname used to open the page and port `3001`; no current machine IP is stored in the code.

Windows Defender Firewall may ask whether Node.js can accept connections. If prompted, allow it only on **Private networks**. Do not enable Public-network access for this prototype. If the prompt was previously denied, open **Windows Security → Firewall & network protection → Allow an app through firewall**, choose **Change settings**, and allow **Node.js JavaScript Runtime** on Private networks. The project does not alter firewall rules automatically.

Some guest, corporate, or public Wi-Fi networks isolate devices even when they share a network name. Use a trusted home/private network if the phone cannot reach the controller URL.

Screen Wake Lock is deferred for this slice. Keep the controller screen awake manually during the test; controller input continues to work without a wake-lock API.

## MVP direction

- A shared host experience runs in a desktop browser and can be shown on a television through HDMI, casting, or another normal display connection.
- Two to four players join in their phone browsers; no phone application installation is required.
- Players eventually join by QR code or a short room code.
- The first controller has one large primary action button and four smaller coloured buttons.
- The first several prototypes use this standard five-button controller.
- A simple tournament or cup links several minigames, each generally understandable within seconds and lasting about 30–90 seconds.
- The first prototype works on a local network and has no rooms, persistent identities, database, accounts, matchmaking, payments, analytics, advertising, or cloud infrastructure.

## Documentation

- [Project status](PROJECT_STATUS.md) — current phase, milestone, next step, and known issues.
- [Product](docs/product.md) — product vision, experience principles, MVP boundaries, and originality requirements.
- [Architecture](docs/architecture.md) — provisional technical direction, boundaries, and communication model.
- [Roadmap](docs/roadmap.md) — ordered, evidence-driven milestones.
- [Decisions](docs/decisions.md) — accepted constraints and provisional technical decisions.
- [Open questions](docs/open-questions.md) — unresolved product, platform, accessibility, and production choices.
- [Agent guidance](AGENTS.md) — repository working rules for Codex and other coding agents.

## Originality

The product must use original names, worlds, characters, assets, presentation, controller styling, and independently designed minigames. Existing game brands and their protected creative expression must not appear in or be copied by the product. Asset sources, licences, generation methods, and commercial usage rights must be documented before commercial release. See [docs/product.md](docs/product.md) and [docs/decisions.md](docs/decisions.md) for the durable requirements.
