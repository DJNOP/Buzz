# Project Status

- **Current phase:** Multiplayer controller foundation validation
- **Current milestone:** Roadmap Milestones 1–5 complete
- **Last completed task:** Added server-authoritative rooms, up to four stable player identities, the standard five-button controller, isolated input routing, capacity handling, and temporary reconnection.
- **Next recommended task:** Conduct the documented multi-controller manual test and review the foundation before deciding whether to begin QR-code joining.
- **Date last updated:** 2026-08-02

## Validation summary

The first physical phone test passed over local Wi-Fi: connection succeeded, every deliberate primary press produced exactly one host event, rapid presses were not missed or duplicated, perceived latency was low, and Windows Firewall did not block the private-network connection.

The expanded multiplayer foundation passes strict type checking, 31 automated tests, all production builds, and a local automated smoke scenario covering two rooms, multiple controllers, all five buttons, invalid/full joins, isolation, reconnection, and host room closure. In-app browser QA also verified the join flow, joined-controller layout, host slot update, paired primary input display, and clean browser consoles; a shorter-screen grid issue found during that check was corrected.

## Current architecture summary

The npm-workspaces TypeScript system contains separate React/Vite host and controller applications, a Node.js/Socket.IO server, and a shared typed protocol. A single in-memory `RoomManager` owns authoritative room, player, connection, token, input-count, and latest-input state. Socket.IO is a transport adapter; browser state is presentation or the controller's private reconnection capability.

Each host owns at most one short room code. A room contains up to four players with stable ID, number, name, accent, connection state, and private random reconnection token. The server derives room/player identity from the joined socket for every gameplay input. Disconnected slots are reserved for 20 seconds, then removed. Host disconnection immediately closes its room.

## Known unresolved questions

Final name, visual identity, controller palette/shapes/terminology, first minigame, tournament design, accessibility standards, distribution, monetisation, engine choice, and art/audio pipelines remain unresolved in `docs/open-questions.md`.

## Known technical issues and manual validation

The new four-player UI and all five controls still need a real multi-device ergonomics/accessibility test. Reconnection uses local storage and a bearer-style random token only; it is intentionally not authentication and is lost on server restart. Screen Wake Lock, host reconnection, persistence, internet security, QR joining, and deployment are deferred.
