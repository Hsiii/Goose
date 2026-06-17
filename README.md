# Goose Overlay

Cross-platform desktop overlay pet built with Tauri 2, Rust, SvelteKit, TypeScript, and PixiJS. The current app renders a transparent, click-through goose actor with bounded ambient motion and sprite-based idle, walk, inspect, and honk states.

## Stack

- Tauri 2 for the transparent desktop shell.
- Rust for native bootstrap and window configuration.
- SvelteKit and TypeScript for the overlay surface.
- PixiJS for sprite atlas rendering.
- Bun for JavaScript package management and scripts.

## Repository Layout

```text
src/lib/goose/          Motion rules, sprite clips, and goose-specific types
src/lib/components/     Svelte renderer host components
src/routes/             Transparent overlay route
src-tauri/src/          Native bootstrap and overlay window setup
static/assets/          Runtime sprite atlas and atlas JSON
tools/sprites/          Asset validation utilities
docs/                   Architecture, roadmap, and asset pipeline notes
```

## Development

Install dependencies:

```bash
bun install
```

Run the desktop app:

```bash
bun run tauri dev
```

Run checks:

```bash
bun run check
bun run sprites:check
cd src-tauri && cargo fmt --check
cd src-tauri && env CARGO_TARGET_DIR=/tmp/goose-tauri-target cargo check
```

The temporary Cargo target avoids stale Tauri generated permission files from older absolute checkout paths.

## Assets

The renderer loads `static/assets/goose_spritesheet.json`, which points at `goose_spritesheet.png`. Animation clips are declared in `src/lib/goose/animationManifest.ts` and validated by `bun run sprites:check`.

See `docs/ASSET_PIPELINE.md` for sprite requirements and refresh rules.
