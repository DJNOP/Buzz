# PixelLab prototype asset provenance

This directory is the durable source and audit record for the approved
PixelLab production-pipeline proof. The artwork is temporary prototype
material, not final commercial character or environment art. Commercial use,
licensing, consistency, accessibility, and production-readiness remain
unapproved.

Runtime images live under
[`apps/host/public/assets/pixellab/`](../../../apps/host/public/assets/pixellab/),
runtime mappings live in
[`apps/host/src/sprite-assets.ts`](../../../apps/host/src/sprite-assets.ts), and
machine-readable provenance lives in [`manifest.json`](manifest.json). The
generated presentation can be disabled at build or dev startup with
`VITE_SIGNAL_SPRINT_PIXELLAB_SPRITES=false`; the repository-owned CSS robot and
four distinct station fallbacks remain available.

## Approved master robot v1

The supplied
[`service-robot-concept-clean.png`](../../art-references/service-robot-concept-clean.png)
guided four 96x96 transparent `create_image_pixflux` candidates; their job IDs
and seeds are recorded in the manifest. Human review used Candidate 03 as the
structural base and Candidate 01 as the softer capsule reference for two
reference-mode `edit_image` refinements. R02 was approved and is retained as
[`master-robot-refined-02.png`](source/master-robot-refined-02.png) (job
`d3fc17b6-995c-4df8-90c3-4f80d46fc41a`, seed `5302`).

The approved neutral master is
[`prototype-service-robot-master-v1.png`](source/prototype-service-robot-master-v1.png).
PixelLab `inpaint_image` job `497a8d66-406e-4a8a-bbc2-e0524e915818`
(seed `6601`) removed the smile through a 10x6 mouth mask while preserving the
eyes and every pixel outside the mask. It is a 96x96 RGBA PNG with SHA-256
`274B437755B780E53BB1FB1F368D378D1345D648C8D4AA563D69963491CC1235`.

## Selected robot animations

Each PixelLab `animate_image` result derives from the neutral master. Selected
frame 0 is byte-identical to that master. The selected frames and sprite sheets
remain beside their runtime animated PNGs, so the approved sheets can be
reproduced without retaining unselected service outputs.

| State | Job | Seed | Raw / selected | Selected raw indices | Durations (ms) |
| --- | --- | ---: | --- | --- | --- |
| Idle | `9783b93b-2502-422e-917b-bc893c6129de` | 6703 | 5 / 4 | `master, 1, 3, 4` | `260, 160, 180, 260` |
| Input acknowledgement | `483ea343-13ac-4846-9d9e-3d8d9a93367c` | 6704 | 5 / 4 | `master, 1, 3, 4` | `240, 150, 170, 300` |
| Correct | `f70820f3-4ff3-4736-9b9f-4ad7b55b072f` | 6801 | 5 / 4 | `master, 1, 3, 4` | `220, 150, 180, 270` |
| Wrong | `ec77c41a-8b08-471e-98a6-f8db3e307ce4` | 6802 | 5 / 4 | `master, 1, 2, 4` | `220, 160, 190, 280` |
| Stunned | `9a04d98e-d218-4c64-a37e-11202b734031` | 6803 | 5 / 4 | `master, 2, 3, 4` | `220, 190, 190, 300` |
| Winning | `b0b58202-f126-4c12-9616-0fdb2203d727` | 6804 | 7 / 6 | `master, 1, 2, 3, repaired-04, 6` | `190, 130, 140, 180, 140, 280` |

Winning raw frames 4 and 5 introduced forbidden star eyes. An eye-only
`inpaint_image` repair (job `3c8a87cd-e101-443c-a088-da342dffb5ea`, seed
`6805`) produced selected frame 4 without changing pixels outside its mask;
raw frame 5 was excluded. Working and losing outside the focused Lighting
station intentionally remain CSS-only.

## Selected Lighting workset

The revised Lighting interaction diorama uses a dedicated provisional
three-quarter robot workset. PixelLab MCP `create_character` v3 used the exact
approved neutral master as its reference and created character
`ad197fed-092a-4010-a68a-b31366ed8de3`; its selected south-east source is
[`character-south-east.png`](source/robot-lighting/character-south-east.png).
Four single-direction `animate_character` v3 jobs then supplied work idle,
reach/contact, wrong recoil, and stunned hold. The existing approved winning
animation remains mapped for results.

| State | Animation group | Animation | Selected raw indices | Durations (ms) |
| --- | --- | --- | --- | --- |
| Work idle | `7db1ac00-7700-4b63-ae44-88c94a234f98` | `affc56d9-57c0-43f9-8639-b1b42dcf8173` | `0, 2, 3, 0` | `260, 220, 240, 280` |
| Reach/contact | `c4da4fff-82b4-4312-bf8b-3ff142618252` | `cb67845c-433c-4f2d-a33e-873311ca5167` | `0, 1, 2, 3` | `90, 110, 150, 210` |
| Wrong recoil | `6c41b3a7-4f73-4df7-a666-a356021fb971` | `bbbd4fd5-10a5-4ef1-966a-55a3bfe65300` | `0, 1, 2, 3` | `90, 110, 140, 180` |
| Stunned hold | `07aa1df3-2b8b-4e5b-90cf-8f9a10571b76` | `91898783-3873-4170-b516-d693a39d45d8` | `0, 1, 2, 3` | `130, 150, 170, 210` |

The generated 136x136 frames were cropped consistently by `(20, 16, 116,
112)` to the established 96x96 runtime canvas. All 16 selected frames have hard
alpha and share floor pixel y=84. Normalized head, torso, working-hand, and feet
anchors are recorded in the manifest. Two detached reaction symbols outside
the stunned robot silhouette were removed with the exact rectangles recorded
there; no robot pixels were repainted. Raw/rejected service output remains only
under ignored `temp/pixellab/`.

The balance moved from 1,423 remaining / 577 used to 1,413 remaining / 587
used: exactly 10 subscription generations, with no credit spend. This workset
is accepted only for the provisional Lighting interaction proof, not as final
commercial character art or approval to upgrade the other stations.

## Accepted light-rig family

The initial 128x96 `create_image_pixflux` output (job
`76fa1a27-8b7f-4f0d-8dbd-9393797a011e`, seed `6901`) was cleaned with
reference-mode `edit_image` job `49b2ddba-904f-47bc-965e-0a01fbad9f0d`
(seed `6902`). The accepted
[`light-rig-structural-source.png`](source/light-rig-structural-source.png) and
[`light-rig-controls-mask.png`](source/light-rig-controls-mask.png) are retained
with the four untranslated PixelLab outputs under
[`source/light-rig-raw/`](source/light-rig-raw/).

| State | Inpaint job | Seed | Runtime file |
| --- | --- | ---: | --- |
| Broken | `84d2b143-63d4-463b-bf90-a99908f3f7c7` | 6920 | [`broken.png`](../../../apps/host/public/assets/pixellab/light-rig/broken.png) |
| Partial | `60c43027-bddf-4760-a039-ee7ba9726679` | 6921 | [`partial.png`](../../../apps/host/public/assets/pixellab/light-rig/partial.png) |
| Nearly operational | `1512c420-e572-48f4-95a2-cb5c1cab42f6` | 6922 | [`nearly-operational.png`](../../../apps/host/public/assets/pixellab/light-rig/nearly-operational.png) |
| Complete | `4d6fe3eb-88bc-4131-9443-ce8be153a62b` | 6923 | [`complete.png`](../../../apps/host/public/assets/pixellab/light-rig/complete.png) |

All four raw states changed zero pixels outside the shared mask and share alpha
bounds `(14, 13, 82, 90)`. Runtime files apply the same lossless `(16, 0)`
translation and share alpha bounds `(30, 13, 98, 90)`.

## Accepted distinct station families

On 2026-08-03, PixelLab balance was 1,729 subscription generations before and
1,423 after this generation pass: 306 generations used. Two 128x96 transparent
PixFlux base candidates were generated for each new station using the accepted
complete lighting station as both composition and forced-palette reference.
The selected bases were:

- **Sound 7101:** strongest immediate mixing-console silhouette, readable
  waveform, integrated monitors, and cable while preserving robot/target space.
- **Decorations 7201:** the only candidate with a clear setup bench, stable
  frame, organized supplies, and enough structure for materially different
  setup states.
- **Machinery 7302:** clearest enclosed control footprint and backdrop/lift
  display, with comparable visual weight and no unsafe exposed mechanism.

Candidates 7102, 7202, and 7301 were rejected and are recorded only by job ID
in the manifest. Their images were not retained. One broad-mask sound pass and
one broad-mask machinery-broken pass were also rejected because their shells
drifted; the accepted replacements reuse the proven light-rig controls mask so
every pixel outside the screen/control region is identical to the selected
source. This was one structural alignment correction, not iterative cosmetic
regeneration.

| Station | State | Job | Seed | Runtime file |
| --- | --- | --- | ---: | --- |
| Sound | Broken | `302931e0-5f20-4fdf-825a-e7bf7b54a9d6` | 7113 | `stations/sound/broken.png` |
| Sound | Partial | `e4a78c1b-7e89-44f8-81bc-2a7d653ab961` | 7114 | `stations/sound/partial.png` |
| Sound | Nearly operational | `eee77849-9525-42cc-8ecf-b88773bf8a87` | 7115 | `stations/sound/nearly-operational.png` |
| Sound | Complete / selected base | `7a13cb24-29e8-4281-bb5c-872c340beea7` | 7101 | `stations/sound/complete.png` |
| Decorations | Broken | `c551e14f-ff40-4426-94db-d79ca43083b5` | 7210 | `stations/decorations/broken.png` |
| Decorations | Partial | `f5243c92-9882-44bb-9540-c582e74515e9` | 7211 | `stations/decorations/partial.png` |
| Decorations | Nearly operational | `d203c471-b268-4cec-9ebd-5031d5ed8f72` | 7212 | `stations/decorations/nearly-operational.png` |
| Decorations | Complete | `69cbae09-a6d1-485f-aa33-ce54c19a7363` | 7213 | `stations/decorations/complete.png` |
| Machinery | Broken | `27f3d11e-6b23-4058-897b-348eb64baeec` | 7314 | `stations/machinery/broken.png` |
| Machinery | Partial | `ef6008e9-73a3-49a9-b674-5e2f779faa80` | 7315 | `stations/machinery/partial.png` |
| Machinery | Nearly operational | `01520818-e4bc-483c-bde8-e7c5fca9266f` | 7316 | `stations/machinery/nearly-operational.png` |
| Machinery | Complete | `b45a74a2-0704-45b8-bc5e-7f2572a923be` | 7317 | `stations/machinery/complete.png` |

The three selected structural sources are retained under `source/stations/`.
All twelve runtime states are transparent 128x96 PNGs with hard alpha. Sound
shares alpha bounds `(16, 13, 103, 89)`. Machinery keeps the same anchored
shell and changes zero pixels outside the shared controls mask; its complete
state adds a masked indicator at x=25. Decoration states change only within the
recorded `(30, 8, 68, 66)` setup rectangle, preserving the base and legs; the
broken state's smaller alpha bounds intentionally represent a collapsed setup.

## Representative QA

The compact review record retains the original robot/lighting-state proof plus
representative one-player, four-player, 1280x720, results, and joint-winner
views for the distinct-station composition:

- [`signal-sprint-broken-1920x1080.png`](qa/signal-sprint-broken-1920x1080.png)
- [`signal-sprint-stunned-1920x1080.png`](qa/signal-sprint-stunned-1920x1080.png)
- [`signal-sprint-complete-results-1920x1080.png`](qa/signal-sprint-complete-results-1920x1080.png)
- [`distinct-stations-one-player-1920x1080.png`](qa/distinct-stations-one-player-1920x1080.png)
- [`distinct-stations-four-player-1920x1080.png`](qa/distinct-stations-four-player-1920x1080.png)
- [`distinct-stations-four-player-1280x720.png`](qa/distinct-stations-four-player-1280x720.png)
- [`distinct-stations-results-1280x720.png`](qa/distinct-stations-results-1280x720.png)
- [`distinct-stations-joint-results-1920x1080.png`](qa/distinct-stations-joint-results-1920x1080.png)
- [`lighting-diorama-revised-one-player-work-idle-1920x1080.png`](qa/lighting-diorama-revised-one-player-work-idle-1920x1080.png)
- [`lighting-diorama-revised-one-player-contact-correct-1920x1080.png`](qa/lighting-diorama-revised-one-player-contact-correct-1920x1080.png)
- [`lighting-diorama-revised-one-player-wrong-reaction-1920x1080.png`](qa/lighting-diorama-revised-one-player-wrong-reaction-1920x1080.png)
- [`lighting-diorama-revised-one-player-stunned-hold-1920x1080.png`](qa/lighting-diorama-revised-one-player-stunned-hold-1920x1080.png)
- [`lighting-diorama-revised-one-player-partial-progress-1920x1080.png`](qa/lighting-diorama-revised-one-player-partial-progress-1920x1080.png)
- [`lighting-diorama-revised-one-player-complete-1920x1080.png`](qa/lighting-diorama-revised-one-player-complete-1920x1080.png)
- [`lighting-diorama-revised-one-player-results-1920x1080.png`](qa/lighting-diorama-revised-one-player-results-1920x1080.png)
- [`lighting-diorama-revised-four-player-active-1280x720.png`](qa/lighting-diorama-revised-four-player-active-1280x720.png)
- [`lighting-diorama-revised-four-player-contact-1280x720.png`](qa/lighting-diorama-revised-four-player-contact-1280x720.png)
- [`lighting-diorama-revised-four-player-mixed-progress-1280x720.png`](qa/lighting-diorama-revised-four-player-mixed-progress-1280x720.png)
- [`lighting-diorama-revised-four-player-stunned-1280x720.png`](qa/lighting-diorama-revised-four-player-stunned-1280x720.png)
- [`lighting-diorama-revised-four-player-results-1280x720.png`](qa/lighting-diorama-revised-four-player-results-1280x720.png)
- [`lighting-diorama-revised-fallback-one-player-contact-1920x1080.png`](qa/lighting-diorama-revised-fallback-one-player-contact-1920x1080.png)
- [`lighting-diorama-revised-fallback-one-player-stunned-1920x1080.png`](qa/lighting-diorama-revised-fallback-one-player-stunned-1920x1080.png)
- [`lighting-diorama-revised-fallback-four-player-mixed-progress-1280x720.png`](qa/lighting-diorama-revised-fallback-four-player-mixed-progress-1280x720.png)

Browser QA additionally covered one-, two-, three-, and four-player occupancy;
independent mixed progress; idle, correct, wrong, stunned, working fallback, and
winning presentation; all four shared station thresholds; results; replay;
clean host/controller consoles; and zero document overflow. The 600 ms stun was
observed authoritatively, but browser screenshot latency made the retained
wrong-input frame land after the transient state cleared, so the earlier
dedicated stunned proof remains the durable visual record for that state.

The revised Lighting evidence covers work idle, physical contact/correct,
wrong, stunned, partial progress, complete, and results at a true 1920x1080
embedded viewport; active, contact, mixed progress, stunned, and results at
native 1280x720 four-player size; and both one- and four-player CSS fallback.
Every active route retained one integrated target monitor and no detached
status card, with zero document overflow. The generated working-hand anchor was
within 15 pixels of the physical console contact in one-player presentation and
18 pixels in four-player presentation.

## Retention policy

Unselected raw animation frames, rejected wide-mask rig or station states,
unselected station/robot candidates, GIF previews, contact sheets, duplicate
runtime exports, redundant screenshots, and stalled/failed attempts are
intentionally not retained. Disposable future PixelLab work belongs under ignored
`temp/pixellab/`. After human approval, add only the selected sources here,
copy required runtime derivatives to the public asset tree, update the manifest
and mappings, run all validation, and keep the fallback reversible.
