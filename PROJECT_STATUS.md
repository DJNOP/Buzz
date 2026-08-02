# Project Status

- **Current phase:** Local QR room-joining acceptance
- **Current milestone:** Roadmap Milestones 1–6 implemented
- **Last completed task:** Added locally generated QR joining, deterministic server-side LAN address discovery, selectable controller links, safe room-query prefilling, and QR smoke/browser coverage.
- **Next recommended task:** Run the documented real-camera QR acceptance test on iPhone and/or Android before beginning a primitive minigame.
- **Date last updated:** 2026-08-02

## Validation summary

The original physical phone input test passed over local Wi-Fi: connection succeeded, every deliberate primary press produced exactly one host event, rapid presses were not missed or duplicated, perceived latency was low, and Windows Firewall did not block the private-network connection.

The QR foundation passes strict type checking, 45 automated tests, all production builds, and an expanded local smoke scenario. Coverage now includes deterministic network-interface filtering, address delivery to host-role connections, local join-URL construction, safe room-query parsing, QR-prefilled and manual joins, all five controls, capacity, isolation, reconnection, and host room closure.

In-app browser QA verified the host at 1280×720, the controller at true 390×844 and 360×800 CSS viewports, copy-link feedback, lowercase room normalization, name-field priority, successful query removal, invalid-link guidance, correct player routing, and clean application consoles. Real iPhone/Android camera scanning has not yet been performed and remains the manual acceptance gate.

## Current architecture summary

The npm-workspaces TypeScript system contains separate React/Vite host and controller applications, a Node.js/Socket.IO server, and a shared typed protocol. A single in-memory `RoomManager` remains authoritative for rooms, players, connections, tokens, and inputs.

The server separately discovers usable non-internal IPv4 interface addresses and exposes only the ordered address candidates to validated host-role sockets. The host selects a provisional default, permits another detected choice when available, constructs the local controller URL, and renders it as an SVG QR code entirely in the browser. The URL contains only the address, controller port, and room code—never a reconnection token.

The controller treats the `room` query value as untrusted input, normalizes and validates it with shared rules, prefills without auto-joining, and removes the consumed parameter after successful joining or restoration. Manual room-code entry remains fully supported.

## Known unresolved questions

Final name, visual identity, controller palette/shapes/terminology, first minigame, tournament design, accessibility standards, distribution, monetisation, engine choice, art/audio pipelines, and longer-term handling of machines with multiple VPN or virtual network adapters remain unresolved in `docs/open-questions.md`.

## Known technical issues and manual validation

Real-camera scanning distance, camera/browser behaviour, multiple-adapter selection, and the no-same-network failure experience still require Nicholas’s manual test. The QR link is local-network-only and deliberately uses HTTP during development. It cannot cross guest-network isolation, different Wi-Fi networks, VPN routing restrictions, or firewalls.

Reconnection remains a local-storage bearer capability rather than authentication and is lost on server restart. Screen Wake Lock, host reconnection, persistence, internet security/hosting, deployment, minigames, and production infrastructure remain deferred.
