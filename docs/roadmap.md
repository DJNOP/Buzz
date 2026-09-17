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
- **Milestone 1:** Complete; a real phone connected successfully over local Wi-Fi.
- **Milestone 2:** Complete; deliberate and rapid real-phone primary presses produced exactly one low-latency host event each.
- **Milestone 3:** Complete; all five semantic buttons emit paired typed phases with duplicate/stuck-input protections.
- **Milestone 4:** Complete; hosts create isolated rooms for up to four distinctly identified players.
- **Milestone 5:** Complete; capacity, disconnection, 20-second controller reconnection, cleanup, and core automated tests are implemented and validated.
- **Milestone 6:** Technically complete; local QR generation, selectable
  detected addresses, safe controller prefilling, manual fallback, and the
  software joining flow are implemented and validated. A documented
  real-camera QR acceptance test remains outstanding.
- **Milestone 7:** Complete in implementation and technical validation. Signal
  Sprint provides one server-authoritative minigame with a lobby, countdown,
  30-second race, five-button targets, scoring, stuns, results, replay,
  reconnection-aware participation, and room isolation. Its first provisional
  themed vertical slice adds an original Event Rescue venue, reusable service
  robots, a responsive shared-stage composition, integrated foreground
  workstations, four slot-derived event-production stations with independent
  venue consequences, explicit presentation states,
  and a vertical phone controller without changing game rules or introducing a
  game engine or a general minigame framework. The shared venue and provisional
  lighting/sound/event-setup/machinery responsibilities remain presentation
  evidence pending multiplayer playtesting.

The next gate is Milestone 8: run the documented physical two-to-four-player
Signal Sprint playtest. Technical correctness does not establish enjoyment,
social clarity, TV readability with real players, controller ergonomics, or a
desire for another round. Do not add a tournament, additional minigame, game
engine, or further bespoke art/production content before evaluating that
evidence. Existing Lighting-station pre-production and the unmerged Lighting
diorama experiment should remain paused until that gate is complete.
