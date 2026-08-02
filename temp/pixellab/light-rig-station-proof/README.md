# PixelLab light-rig station proof

This folder records one 128x96 transparent light-control rig and four aligned
progress states for the Signal Sprint presentation proof. It contains no game
logic and no environment art.

## Structural source

| Stage | File | PixelLab method | Job | Seed | Result |
| --- | --- | --- | --- | ---: | --- |
| Initial design | [`raw/light-rig-base.png`](raw/light-rig-base.png) | `create_image_pixflux` | `76fa1a27-8b7f-4f0d-8dbd-9393797a011e` | 6901 | Rejected as a production source because it included a loose cable and ground contact. |
| Clean structural source | [`raw/light-rig-structural-source.png`](raw/light-rig-structural-source.png) | reference-preserving `edit_image` | `49b2ddba-904f-47bc-965e-0a01fbad9f0d` | 6902 | Accepted: cable, ground contact, and red/noisy controls removed; shell retained. |

## Accepted progress states

All accepted states use PixelLab `inpaint_image` from the same clean structural
source with [`raw/light-rig-controls-mask.png`](raw/light-rig-controls-mask.png).
Only the screen interior and four lamp faces are editable. Pixel comparison
confirmed zero changed pixels outside that mask for every raw state, and every
raw state has the same alpha bounding box `(14, 13, 82, 90)`. The selected
files under `states/` apply one identical lossless 16px right translation so
the prop is centred for gameplay; their shared alpha bounding box is
`(30, 13, 98, 90)`.

| State | File | Job | Seed | Visual progress |
| --- | --- | --- | ---: | --- |
| Broken | [`states/broken.png`](states/broken.png) | `84d2b143-63d4-463b-bf90-a99908f3f7c7` | 6920 | Dark screen and 0/4 powered lamps. |
| Partial | [`states/partial.png`](states/partial.png) | `60c43027-bddf-4760-a039-ee7ba9726679` | 6921 | One cyan screen segment and 1/4 powered lamps. |
| Nearly operational | [`states/nearly-operational.png`](states/nearly-operational.png) | `1512c420-e572-48f4-95a2-cb5c1cab42f6` | 6922 | Three cyan screen segments and 3/4 powered lamps. |
| Complete | [`states/complete.png`](states/complete.png) | `4d6fe3eb-88bc-4131-9443-ce8be153a62b` | 6923 | Four cyan screen segments and 4/4 powered lamps. |

Review artifacts: [`light-rig-state-atlas.png`](light-rig-state-atlas.png) is a
transparent 512x96 atlas; [`previews/light-rig-states-review.png`](previews/light-rig-states-review.png)
is a nearest-neighbour enlargement on a charcoal review mat.

Untranslated accepted PixelLab service outputs are retained as
`raw/accepted-*-pixellab.png`; the selected files are mechanical alignment
derivatives, not outputs from another image generator.

The first four state attempts used a rectangular mask that was too wide and
could alter the bezel. Their PixelLab jobs are retained under `raw/` for audit:
broken `51dc825c-20bc-4573-889d-bf0929b49d01` (6910), partial
`29f268cf-5e52-4e53-9f78-f1c55e0defed` (6911), nearly operational
`26ef1ec5-eb13-4e0b-8f6a-381c019e0028` (6912), and complete
`84e0e155-e51e-4f87-a473-915caaf79c46` (6913). They are not used by the host.
