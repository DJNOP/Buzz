# Signal Sprint Lighting Station Kit

Status: pre-production  
Branch: `art/signal-sprint-lighting-station-kit`

## Purpose

Create one geometrically approved Lighting workstation before further runtime
integration.

Codex must eventually integrate supplied artwork. Codex must not design the
station.

## Current production gate

Gate 1: static red-contact greybox.

The first required composite shows:

- target `1 / RED / CIRCLE`;
- robot in a readable three-quarter front pose;
- robot hand directly overlapping the red secondary control;
- positive station confirmation;
- one identifiable stage-lighting consequence.

A viewer must immediately understand:

1. What is the active target?
2. Which physical control is being pressed?
3. How does the station confirm the action?
4. What changed on the stage?

No animation or implementation report may be needed to explain the image.

## Canvas

Base station module:

- width: 320 px
- height: 240 px
- four-player target rendering: 1×
- one-player target rendering: 2×
- nearest-neighbour-safe pixel art
- no generated runtime text inside final artwork
- no downscaling from a larger completed pixel-art canvas

The first greybox may use visual placeholders for target content and badge.

## Layer model

Back to front:

1. `10-environment`
2. `20-station-back`
3. `30-robot-body`
4. `40-station-front`
5. `45-robot-working-hand`
6. `50-runtime-placeholder`
7. `60-effects`
8. `00-guides` — hidden

The separate working-hand layer exists so contact can remain visible above the
control surface while the station front occludes the lower body.

## Composition rules

- Robot uses a three-quarter front pose.
- Face remains visible.
- Head, torso, shoulder, arm, and hand form one readable chain.
- Working hand directly overlaps the active button cap.
- Station front hides the lower body, not the face or working hand.
- Monitor is physically attached to the console.
- One primary control is substantially larger than four grouped secondary controls.
- Decorative controls remain subordinate.
- There is only one Lighting console.
- The old Lighting station asset must not appear as a second console.
- The station silhouette must not be one large plain rectangle.
- Background detail remains lower contrast than the target and contact point.

## Visual production gates

### Gate 1 — Silhouette

Using flat colour blocks only, it must be clear:

- where the robot is;
- where the monitor is;
- where the control surface is;
- which hand is working;
- which control is pressed;
- which station layer overlaps the robot.

### Gate 2 — Contact

For target `1 / RED / CIRCLE`, a viewer must identify:

- the active target;
- the red secondary control;
- the robot hand physically overlapping it;
- positive confirmation;
- one visible lighting consequence.

### Gate 3 — Scale

The same composition must remain readable in:

- the 320×240 base canvas;
- a four-player 1280×720 scale proof;
- a one-player 1920×1080 scale proof;
- a later physical TV-distance test.

No detailed artwork or animation may begin before Gates 1–3 pass.

## Approximate scale targets

These are targets, not locked coordinates:

- robot height: 110–135 px
- readable face height: at least 20–24 px
- monitor content: approximately 105×65 px
- primary control: approximately 26–34 px
- secondary controls: approximately 15–21 px
- station-front height: approximately 34–48 px

## Production sequence

1. Create flat contact greybox.
2. Review silhouette and contact.
3. Review at one-player and four-player scale.
4. Revise geometry until Gates 1–3 pass.
5. Create approved contact keyframe.
6. Create idle keyframe.
7. Create stunned keyframe.
8. Add controlled pixel-art materials.
9. Use PixelLab only for identity-preserving poses and interpolation.
10. Perform manual frame cleanup.
11. Export layers, anchors, frames, and metadata.
12. Give Codex a bounded integration specification.

## Scope exclusions

- no Sound, Decorations, or Machinery production;
- no React implementation;
- no gameplay changes;
- no networking changes;
- no full-screen generated background;
- no broad asset experimentation;
- no final branding;
- no production-final art claim;
- no runtime asset copy before artwork approval.