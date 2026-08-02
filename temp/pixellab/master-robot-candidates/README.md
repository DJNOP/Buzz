# PixelLab Master Robot Candidates

Approval-gate output only. The initial four 96x96 transparent PNG candidates
were generated on 2026-08-02 with PixelLab MCP `create_image_pixflux`, using
[`docs/art-references/service-robot-concept-clean.png`](../../../docs/art-references/service-robot-concept-clean.png)
as the init-image reference. Candidate 03 was then chosen as the preferred
structural base and Candidate 01 as the secondary softer-silhouette reference
for exactly two PixelLab `edit_image` reference-mode refinements. Human review
approved R02 as prototype master robot v1 on 2026-08-02.

This is a production-pipeline proof, not final commercial character art. No
asset has been integrated, and no player recolour, direction, correct, wrong,
stunned, winning, losing, station, or other state asset was generated.

## Initial candidates

| Candidate | File | PixelLab job | Seed | Review description |
| --- | --- | --- | ---: | --- |
| 01 | [`master-robot-candidate-01.png`](master-robot-candidate-01.png) | `91aba56d-bbc9-4793-85f2-ef705d29e028` | 4101 | Closest-to-reference capsule silhouette, with compact side-arm accents and a centered chest badge area. |
| 02 | [`master-robot-candidate-02.png`](master-robot-candidate-02.png) | `0f887865-881f-425e-9771-e78d2828f830` | 4102 | Softer dome-and-body interpretation, with more pronounced side appendages and a small centered chest inset. |
| 03 | [`master-robot-candidate-03.png`](master-robot-candidate-03.png) | `1b2baef2-6e54-4d30-906f-3ddae11d84a8` | 4103 | Wider face-screen treatment, stronger lower-shell banding, and a rectangular chest identifier area. |
| 04 | [`master-robot-candidate-04.png`](master-robot-candidate-04.png) | `fd661a01-af7f-4cef-99a0-1b339c8eef66` | 4104 | Roundest body treatment, with separated side-pod accents, compact feet, and a prominent chest badge area. |

## Candidate 03 refinement pass

Both refinements preserve Candidate 03's broad face screen, compact body,
neutral pose, and chest placement while borrowing Candidate 01's softer capsule
contour. Both retain a 96x96 transparent canvas, a cream-white shell, neutral
cyan eyes, a single small flat warm-yellow placeholder accent, symmetrical
separated limbs, simplified antenna, and blank chest overlay space.

| Refined candidate | File | PixelLab job | Seed | Review description |
| --- | --- | --- | ---: | --- |
| R01 | [`master-robot-refined-01.png`](master-robot-refined-01.png) | `07964fb1-8269-470b-92b3-c6cb00a270b4` | 5301 | No-mouth option with the broadest blank face treatment, a soft rounded lower shell, and minimal side accents. |
| R02 | [`master-robot-refined-02.png`](master-robot-refined-02.png) | `d3fc17b6-995c-4df8-90c3-4f80d46fc41a` | 5302 | Closely related capsule option with a subtly different face/torso balance and matching simplified limbs. |

## Approval status

R02 is approved as the structural source for prototype master robot v1. Its
silhouette, proportions, face screen, limbs, antenna position, 96x96 canvas,
and transparency must not be redesigned in this prototype pipeline.

## Neutral prototype master v1

[`prototype-service-robot-master-v1.png`](prototype-service-robot-master-v1.png)
was created from R02 with PixelLab `inpaint_image`. The edit was confined to a
10x6 mouth mask at `(43, 47)`, removing the smile while leaving the two cyan
eyes intact. Pixel comparison confirmed zero changes outside the mask.

| Method | PixelLab job | Seed | Dimensions | Output SHA-256 |
| --- | --- | ---: | --- | --- |
| `inpaint_image` from approved R02 | `497a8d66-406e-4a8a-bbc2-e0524e915818` | 6601 | 96x96 RGBA PNG | `274B437755B780E53BB1FB1F368D378D1345D648C8D4AA563D69963491CC1235` |

## Animation proofs

All six proofs use PixelLab `animate_image` with the approved neutral master as
the supplied first frame, a 96x96 transparent canvas, and no direction change.
PixelLab returns the source plus the requested generated frame count. Every raw
result is retained under its proof's `raw/` folder. Selected frame 0 is copied
directly from `prototype-service-robot-master-v1.png` so it is byte-identical to
the approved source.

Each proof includes selected 96x96 frames, a transparent horizontal sprite
sheet, an animated transparent PNG used by the host, and a nearest-neighbour
GIF on a flat charcoal review mat. No recolours or chest identity symbols are
baked into these files.

| Proof | PixelLab job | Seed | Raw / selected frames | Selected raw indices | Review files |
| --- | --- | ---: | --- | --- | --- |
| Idle | `9783b93b-2502-422e-917b-bc893c6129de` | 6703 | 5 / 4 | `[master, 1, 3, 4]` | [`frames/`](animation-proofs/idle/frames/), [`sheet`](animation-proofs/idle/idle-sprite-sheet.png), [`GIF`](animation-proofs/idle/idle-preview.gif) |
| Input acknowledgement | `483ea343-13ac-4846-9d9e-3d8d9a93367c` | 6704 | 5 / 4 | `[master, 1, 3, 4]` | [`frames/`](animation-proofs/input-acknowledgement/frames/), [`sheet`](animation-proofs/input-acknowledgement/input-acknowledgement-sprite-sheet.png), [`GIF`](animation-proofs/input-acknowledgement/input-acknowledgement-preview.gif) |
| Correct | `f70820f3-4ff3-4736-9b9f-4ad7b55b072f` | 6801 | 5 / 4 | `[master, 1, 3, 4]` | [`frames/`](animation-proofs/correct/frames/), [`sheet`](animation-proofs/correct/correct-sprite-sheet.png), [`GIF`](animation-proofs/correct/correct-preview.gif) |
| Wrong | `ec77c41a-8b08-471e-98a6-f8db3e307ce4` | 6802 | 5 / 4 | `[master, 1, 2, 4]` | [`frames/`](animation-proofs/wrong/frames/), [`sheet`](animation-proofs/wrong/wrong-sprite-sheet.png), [`GIF`](animation-proofs/wrong/wrong-preview.gif) |
| Stunned | `9a04d98e-d218-4c64-a37e-11202b734031` | 6803 | 5 / 4 | `[master, 2, 3, 4]` | [`frames/`](animation-proofs/stunned/frames/), [`sheet`](animation-proofs/stunned/stunned-sprite-sheet.png), [`GIF`](animation-proofs/stunned/stunned-preview.gif) |
| Winning | `b0b58202-f126-4c12-9616-0fdb2203d727` | 6804 | 7 / 6 | `[master, 1, 2, 3, repaired-04, 6]` | [`frames/`](animation-proofs/winning/frames/), [`sheet`](animation-proofs/winning/winning-sprite-sheet.png), [`GIF`](animation-proofs/winning/winning-preview.gif) |

Winning raw frames 4 and 5 introduced forbidden star eyes. Raw frame 4 received
a PixelLab eye-only `inpaint_image` repair (`3c8a87cd-e101-443c-a088-da342dffb5ea`,
seed 6805) that preserved the raised pose and every pixel outside its 29x14
mask. Raw frame 5 remains excluded. The repaired six-frame sequence contains
no star eyes and settles on raw frame 6.

The first interpolation attempts stalled in PixelLab and produced no frames:
idle job `ed4cd8fa-303c-4a77-a016-2b5617b63d8c` (seed 6701) failed by timeout;
input-acknowledgement job `306cfe71-82ce-45bc-8568-932a40db51b0` (seed 6702)
stalled. The successful retries omitted the identical pinned last-frame input
while retaining the requested return-to-idle motion instruction.

The approved neutral master and six animation proofs now back the reversible
host presentation path. Working and losing intentionally remain CSS-only
fallback states because this milestone did not authorize generating them.
