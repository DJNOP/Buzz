# Game Ideas

This is the lightweight inventory of concrete gameplay ideas found in the
repository. An implemented prototype is not an approved production minigame,
and automated correctness is not playtest evidence.

## Signal Sprint

**Status:** Prototype

**Core interaction:** Each participant watches an individual target on the
shared host screen and presses the matching controller button. A correct press
scores one point and changes the target. A wrong press records a mistake and
briefly stuns that player. The first player to 15 wins; otherwise the highest
score after 30 seconds wins, with joint winners for ties.

**Controller inputs:** All five standard inputs: `primary`, `secondary1`,
`secondary2`, `secondary3`, and `secondary4`. The current presentation labels
them A, 1 Red, 2 Blue, 3 Yellow, and 4 Green.

**Round length:** Three-second countdown plus up to 30 seconds of play.

**Why it might be fun:** It creates a visible simultaneous speed-and-accuracy
race, with rapidly changing cues, public progress, mistakes, and short setbacks.
Whether that actually produces laughter, tension, or replayability is unverified.

**Main uncertainty:** Is repeated cue matching enjoyable and socially readable
with two to four people at television distance, and do players want another
round after playing it?

**Implementation state:** Playable, server-authoritative prototype with rooms,
reconnection-aware participation, scoring, stuns, results, replay, and a
provisional themed presentation. It is deliberately a focused rules module,
not a general minigame framework.

**Playtest evidence:** No documented physical two-to-four-player enjoyment
playtest. Automated tests, a live software smoke scenario, prior browser QA,
and an earlier single-phone input test establish technical behavior only.

**Notes:** Signal Sprint, Event Rescue, service robots, station roles, exact
rules, visual assets, colours, labels, and controller styling are provisional.
The Lighting-station pre-production branch and the unmerged Lighting diorama
experiment do not change this status.

## Other recovered gameplay direction

- **Overall structure — documented/decided, unimplemented:** A simple
  tournament or cup containing several short minigames; no concrete bracket,
  scoring, progression, or reward design is recorded.
- **Alternative controller concepts — idea/backlog:** Alternative layouts,
  gestures, hidden information, sliders, and directional controls are mentioned
  as later possibilities. No concrete minigame design using them was found.
- **Additional minigames:** None found in current tracked documentation, source
  comments, planning files, or reachable branch history.
