# Architecture

Goose is structured as a thin native overlay host with a Svelte/Pixi actor renderer. The goal is to keep OS integration isolated from animation and product behavior so reminders, tray controls, and opt-in cursor behavior can be added without turning the overlay route into a catch-all.

## Runtime Flow

1. Tauri starts the `overlay` webview window from `src-tauri/tauri.conf.json`.
2. `src-tauri/src/overlay.rs` resizes the window to the active monitor and makes it transparent, always-on-top, focusless, and click-through.
3. `src/routes/+page.svelte` mounts the transparent overlay shell.
4. `GooseRenderer.svelte` creates a PixiJS application sized to the overlay host.
5. `src/lib/goose/motion.ts` advances deterministic-enough ambient movement each Pixi tick.
6. `src/lib/goose/animationManifest.ts` maps motion states to atlas textures.

## Boundaries

- Native code owns window behavior, platform capability discovery, and future OS integrations.
- Svelte owns DOM shell composition only.
- Pixi owns sprite drawing and animation playback.
- `src/lib/goose` owns goose-specific state, types, and animation contracts.
- `tools/sprites` owns validation and future asset preparation scripts.

## Near-Term Work

- Add a tray menu with pause, mute, and quit actions.
- Add reminder state and native notification delivery.
- Persist user settings before adding any disruptive interaction.
- Add multi-monitor placement handling instead of using only the current or primary monitor.
