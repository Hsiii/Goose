# Goose Overlay Implementation Plan

## Product Goal

Build a cross-platform desktop pet for macOS and Windows that lives in a transparent overlay window, moves around the screen, reminds the user about hydration and posture, and later supports opt-in mischievous cursor interaction.

## Agent Execution Rules

- Keep the app usable even when native permissions are denied.
- Treat cursor and window interaction as opt-in features with hard kill switches.
- Prefer minimal, reversible slices that compile and can be tested locally.
- Land architecture in layers: scaffold, overlay shell, renderer, scheduler, native integrations, packaging.
- Update this document when scope or sequencing changes in a material way.

## Stack Decision

- Desktop shell: Tauri 2
- Native layer: Rust
- Frontend: SvelteKit with TypeScript
- Animation: PixiJS in a later milestone
- Local persistence: simple config store first, SQLite only if history or analytics becomes necessary
- Input automation: Enigo after the overlay and reminders are stable

## Target Architecture

### Frontend

- `src/routes/+page.svelte`: overlay shell and development HUD
- `src/lib/components/`: goose visuals and reminder surfaces
- `src/lib/state/`: UI-side stores for bootstrap state, settings, and reminder previews
- `src/lib/engine/`: deterministic behavior rules that can stay in TypeScript until native constraints require Rust

### Native

- `src-tauri/src/lib.rs`: command registration and app bootstrap
- `src-tauri/src/system/`: platform-specific wrappers for permissions, idle time, and startup registration
- `src-tauri/src/reminders/`: persisted timers and notification orchestration
- `src-tauri/src/input/`: cursor nudges and guardrails for future opt-in mischief

## Milestones

### Milestone 1: Overlay Shell

Goal: establish the product shell and a visible goose prototype.

Tasks:
- Configure a transparent always-on-top overlay window.
- Replace the template screen with a product-specific overlay prototype.
- Expose a native bootstrap command for platform and default settings.
- Document the roadmap in-repo.

Definition of done:
- App launches with product metadata.
- Overlay UI no longer contains template content.
- Frontend can fetch initial state from Rust.

### Milestone 2: Goose Renderer

Goal: render the goose as an animated actor instead of a static prototype.

Tasks:
- Add PixiJS.
- Load sprite sheets and define initial animation states: idle, walk, honk, sleep, alert.
- Implement screen-bounded movement and idle animation timing.

Definition of done:
- Goose visibly animates.
- Renderer remains lightweight while idle.

### Milestone 3: Reminder Engine

Goal: ship hydration and posture reminders before any disruptive interaction.

Tasks:
- Create reminder scheduling with persisted timestamps.
- Add snooze and dismiss behavior.
- Trigger native notifications and in-overlay reminder states.
- Respect quiet hours.

Definition of done:
- Reminder cadence survives restart.
- Reminders do not spam after sleep or wake.

### Milestone 4: Native System Awareness

Goal: make behavior context-aware and permission-safe.

Tasks:
- Implement idle detection.
- Add startup-on-login.
- Add permission checks for macOS accessibility.
- Display supported and unsupported capability states in UI.

Definition of done:
- Missing permissions degrade gracefully.
- Idle state influences goose behavior.

### Milestone 5: Opt-In Mischief

Goal: add bounded cursor interaction without making the app hostile.

Tasks:
- Add Enigo.
- Implement small cursor nudges only.
- Protect with cooldowns, feature flags, and work mode.
- Avoid true drag-and-hold interactions in the first release.

Definition of done:
- Mouse interaction is disabled by default.
- Users can instantly pause or disable the feature.

### Milestone 6: Packaging and QA

Goal: produce stable Windows and macOS builds.

Tasks:
- Add packaging and release automation.
- Validate multi-monitor, high-DPI, full-screen, and sleep/wake behavior.
- Add logging for overlay and permission failures.

Definition of done:
- App installs and starts cleanly on both target platforms.

## Working Backlog

### Near-term

- Add a dedicated settings window instead of keeping settings in the overlay.
- Replace the CSS prototype goose with a PixiJS scene.
- Introduce a shared TypeScript model for reminder and behavior state.
- Add tray controls for pause, mute, and quit.

### Later

- Optional posture detection via webcam with explicit consent.
- Audio cues.
- Multiple goose personalities.
- Analytics only if strictly local and user-visible.

## Risks and Guardrails

- macOS accessibility permissions are the main product risk for cursor interaction.
- Transparent overlay behavior can be fragile on multi-monitor and scaling setups.
- The app must never trap pointer input or feel malicious.
- Performance matters more than visual complexity in the first release.

## Current Status

- Milestone 1 has started.
- The repository contains a Tauri 2 + SvelteKit scaffold.
- The next implementation target is a proper actor renderer and settings model.