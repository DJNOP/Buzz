# Project Status

- **Current phase:** Foundation
- **Current milestone:** Repository and documentation setup
- **Last completed task:** None
- **Next recommended task:** Review and approve the repository foundation before scaffolding application code.
- **Date last updated:** 2026-08-02

## Current architecture summary

The proposed first prototype is a TypeScript web system with separate React/Vite host and phone-controller interfaces, a Node.js/Socket.IO real-time server, and shared TypeScript protocol definitions. It is local-network-first, has no database or authentication, and keeps game rules separate from browser-host presentation so a different host client could be introduced later. These technology choices remain provisional until early controller-to-host communication is validated.

## Known unresolved questions

The final name, visual identity, controller styling, first minigame, tournament design, accessibility requirements, distribution model, monetisation, engine choice, and art/audio production pipelines are unresolved. The complete list is maintained in `docs/open-questions.md`.

## Known technical issues

None yet. Application code and dependencies have not been created, so the proposed architecture has not been validated in a working prototype.
