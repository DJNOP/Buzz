# Roadmap

The roadmap is deliberately sequential. Complete and evaluate each milestone before expanding scope. A milestone should have explicit acceptance criteria when implementation begins.

## Milestones

0. **Repository foundation and project documentation.** Establish durable scope, constraints, decisions, status, and working guidance without creating application code.
1. **Connect one controller to one host.** One phone browser connects to one host browser.
2. **Prove the primary input loop.** One press of the primary phone button appears immediately on the host.
3. **Complete the standard input set.** Implement all five standard controller buttons.
4. **Introduce multiplayer rooms.** Add room creation and up to four uniquely identified players.
5. **Make sessions resilient.** Add room capacity handling, disconnection, reconnection, and core automated tests.
6. **Simplify local joining.** Add QR-code joining over the same local network.
7. **Prove gameplay.** Build one primitive playable minigame using simple shapes and the standard controller.
8. **Test with real players.** Conduct a real multiplayer playtest.
9. **Evaluate the foundation.** Review latency, controller ergonomics, accessibility, technical architecture, and whether players genuinely want another round.
10. **Choose the next investment.** Only then decide whether to introduce a game engine, polished characters, animation production, alternative phone controls, deployment, or additional minigames.

## Current position

- **Milestone 0:** Complete and committed.
- **Milestone 1:** Implementation, automated checks, and same-computer smoke validation complete; real phone-browser validation pending.
- **Milestone 2:** Implementation, automated checks, and live Socket.IO smoke validation complete; real phone input/latency validation pending.

Do not begin Milestone 3 until the private-network phone test has been completed and Milestones 1 and 2 have been approved.
