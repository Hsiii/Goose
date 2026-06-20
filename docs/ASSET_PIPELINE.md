# Asset Pipeline

The app ships one runtime atlas:

- `static/assets/goose_spritesheet.png`
- `static/assets/goose_spritesheet.json`

The atlas uses 128 by 128 pixel cells with transparent backgrounds. Pixi loads the JSON file and resolves texture names from the `frames` object.

## Animation Clips

Clip definitions live in `src/lib/goose/animationManifest.ts`.

Current clips:

- `idle`: 4-frame ambient standing cycle from `goose_actions`.
- `walk`: 8-frame right-facing walking cadence from `goose_walk`.
- `turn`: 4-frame 3/4 pivot cycle from `goose_actions`, with the middle frames showing the goose's rear/tail side.
- `inspect`: 4-frame looking or foraging cycle from `goose_actions`.
- `honk`: 6-frame open-beak attention cycle from `goose_reminders`.
- `hydrate`: 5-frame hydration reminder cycle with a small attached water drop from `goose_reminders`.
- `alert`: 4-frame reserved reminder cycle for future hydration or posture prompts.

Every clip must start from an idle-compatible contact pose. Short action clips must also end on an idle-compatible contact pose so the renderer can switch between states without a visual pop. The renderer restarts each clip at frame 0 on state changes, so frame 0 is the entry transition frame for every cycle.

The deterministic rebuilder in `tools/sprites/rebuild-goose-atlas.ts` owns this contract:

- `idle` begins and ends in the neutral standing pose, with subtle body motion in the middle frames.
- `walk` starts from a neutral standing contact pose before entering alternating stride frames.
- `turn`, `inspect`, `honk`, `hydrate`, and `alert` start and end in neutral standing contact poses.
- Reminder effects must stay attached to the goose silhouette and must not add detached particles, shadows, text, guide marks, or scenery.

## Validation

Run:

```bash
bun run sprites:check
```

The validator checks that required sprite groups exist, every frame stays inside atlas bounds, and every frame remains 128 by 128 pixels.

## Rebuilding

Run:

```bash
bun run sprites:rebuild
```

The rebuilder preserves the existing atlas JSON layout and redraws every frame from `tools/sprites/reference-goose.png`. That reference is the canonical pixel-art identity: tall upright neck, compact white body, black outline, orange beak, orange feet, and restrained grey feather shading. Rebuilds may add small pose offsets or beak-open variants, but they must not change the goose's style or proportions.

## Refresh Rules

- Keep generated source images outside the runtime bundle unless they are needed by the app.
- Do not use absolute local paths in asset tooling.
- Keep `tools/sprites/reference-goose.png` as the source of truth for goose style and proportions.
- Keep atlas frame names stable or update `animationManifest.ts` in the same commit.
- Keep sprite dimensions stable unless renderer constants and validation rules change together.
- Regenerate `static/favicon.png` from `src-tauri/icons/icon.png` when the application icon changes.
