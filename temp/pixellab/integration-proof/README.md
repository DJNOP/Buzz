# Signal Sprint PixelLab integration proof

This review bundle records the reversible host presentation path on branch
`feat/pixellab-light-rig-integration-proof`. It changes no server, shared
protocol, scoring, timing, target selection, networking, or controller code.

## Runtime asset path

- Robot states `idle`, `inputAcknowledgement`, `correct`, `wrong`, `stunned`,
  and `winning` map to transparent animated PNGs.
- `working` and `losing` intentionally retain the existing CSS robot because
  this milestone did not authorize generating those animations.
- Light-rig progress maps score 0 to `broken`, scores 1 through 9 to `partial`,
  scores 10 through 14 to `nearlyOperational`, and score 15+ to `complete`.
- Every lane uses the same light-rig design. Player identity remains the
  existing number, label, colour, and shape; a recolourable shape is overlaid
  on the robot's blank chest at runtime.
- Image load errors fall back to the existing CSS/SVG-like presentation. Set
  `VITE_SIGNAL_SPRINT_PIXELLAB_SPRITES=false` at build/dev startup to disable
  the PixelLab path explicitly.

Asset metadata is isolated in `apps/host/src/sprite-assets.ts` and
`apps/host/public/assets/pixellab/manifest.json`; authoritative game-state to
robot-state derivation remains in `apps/host/src/robot-presentation.ts`.

## Browser review

In-app browser QA used an exact 1920x1080 viewport and a real room-server
session. It verified:

- idle, correct, wrong, stunned, working fallback, and winning robot states;
- broken, partial, nearly operational, and complete light-rig state URLs;
- score transitions at 0, 1, 10, and 15;
- the complete rig remains visible in the results card after the immediate
  score-15 results transition;
- `data-visual-source="pixellab"` on generated states and
  `data-visual-source="css-fallback"` on the intentional working fallback;
- no host console errors or warnings; and
- zero horizontal or vertical document overflow at 1920x1080.

Representative captures:

- [`signal-sprint-broken-1920x1080.png`](screenshots/signal-sprint-broken-1920x1080.png)
- [`signal-sprint-stunned-1920x1080.png`](screenshots/signal-sprint-stunned-1920x1080.png)
- [`signal-sprint-complete-results-1920x1080.png`](screenshots/signal-sprint-complete-results-1920x1080.png)

## Critical assessment

The PixelLab robot and light rig are legible and clean at the one-player TV
layout size, the blank chest overlay remains readable, and the station's
0/1/3/4 powered-lamp progression scans quickly. The result proves the asset
pipeline and state wiring, but it is still prototype art: the existing CSS
`working`/`losing` fallbacks are much taller and stylistically different from
the PixelLab master, so transitions into those states visibly change scale.
That mismatch is intentionally left unresolved because generating those two
states was outside this approved milestone.

