# PixelLab presentation proof assets

These assets are an approved prototype-pipeline proof, not final commercial
art. Runtime mappings live in `apps/host/src/sprite-assets.ts`; generation
provenance lives in `manifest.json` and the complete raw/review material remains
under `temp/pixellab/`.

The host uses animated PNGs for supported robot presentation states and static
PNGs for light-rig progress. The original CSS robot and station prop remain the
automatic load-error fallback and can be selected explicitly with:

```text
VITE_SIGNAL_SPRINT_PIXELLAB_SPRITES=false
```

Player identity is not baked into the generated master. The host overlays the
existing player-colour shape on the blank chest and retains the visible player
labels.

