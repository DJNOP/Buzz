# PixelLab runtime assets

These PNGs are temporary Signal Sprint prototype assets loaded only by the host
presentation layer. They are not production-final or commercially cleared art.

- `robot/` contains the selected service-robot animations and retained frames.
- `light-rig/` contains the four accepted lighting-control station states.
- `stations/` contains four aligned states for sound control, decorations/event
  setup, and stage machinery.

Runtime URLs and progress-state mappings are centralized in
`apps/host/src/sprite-assets.ts`. Set
`VITE_SIGNAL_SPRINT_PIXELLAB_SPRITES=false` to use the repository-owned CSS
fallbacks. Durable generation records and selected structural sources live in
`docs/art-provenance/pixellab/`; rejected and disposable outputs do not belong
in this directory.
