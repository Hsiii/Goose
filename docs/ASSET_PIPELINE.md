# Asset Pipeline

The app ships one runtime atlas:

- `static/assets/goose_spritesheet.png`
- `static/assets/goose_spritesheet.json`

The atlas uses 128 by 128 pixel cells with transparent backgrounds. Pixi loads the JSON file and resolves texture names from the `frames` object.

## Animation Clips

Clip definitions live in `src/lib/goose/animationManifest.ts`.

Current clips:

- `idle`: ambient standing frames from `goose_actions`.
- `walk`: 8-frame right-facing walking cadence from `goose_walk`.
- `turn`: narrow pivot frames from `goose_actions`.
- `inspect`: looking or foraging frames from `goose_actions`.
- `honk`: open-beak attention frames from `goose_reminders`.
- `hydrate`: hydration reminder frames with a small attached water drop from `goose_reminders`.
- `alert`: reserved reminder state for future hydration or posture prompts.

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
