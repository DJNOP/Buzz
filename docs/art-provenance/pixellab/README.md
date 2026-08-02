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
station remain the fallback.

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
raw frame 5 was excluded. Working and losing intentionally remain CSS-only.

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

## Representative QA

The compact review record retains only an active broken/idle view, an
authoritative stunned view, and the completed results view:

- [`signal-sprint-broken-1920x1080.png`](qa/signal-sprint-broken-1920x1080.png)
- [`signal-sprint-stunned-1920x1080.png`](qa/signal-sprint-stunned-1920x1080.png)
- [`signal-sprint-complete-results-1920x1080.png`](qa/signal-sprint-complete-results-1920x1080.png)

The original 1920x1080 browser QA also covered idle, correct, wrong, working
fallback, winning, all four rig thresholds, results, replay, clean consoles,
and zero document overflow.

## Retention policy

Unselected raw animation frames, rejected wide-mask rig states, initial and
unapproved robot candidates, GIF previews, contact sheets, duplicate runtime
exports, redundant screenshots, and stalled/failed attempts are intentionally
not retained. Disposable future PixelLab work belongs under ignored
`temp/pixellab/`. After human approval, add only the selected sources here,
copy required runtime derivatives to the public asset tree, update the manifest
and mappings, run all validation, and keep the fallback reversible.
