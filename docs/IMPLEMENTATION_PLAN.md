# Goose Overlay Roadmap

## Current Product Goal

Build a cross-platform desktop pet for macOS and Windows that lives in a transparent overlay window, moves around the screen, reminds the user about hydration and posture, and later supports opt-in cursor interaction with strict guardrails.

## Engineering Rules

- Keep the app usable even when native permissions are denied.
- Treat cursor and window interaction as opt-in features with hard kill switches.
- Keep the overlay click-through unless the user explicitly opens controls.
- Keep generated asset tooling portable; no absolute local source paths.
- Keep motion and renderer state in TypeScript until native constraints require Rust.

## Completed

- Transparent always-on-top Tauri overlay window.
- Focusless and click-through window setup.
- PixiJS sprite renderer.
- Typed goose motion states.
- Sprite atlas validation.
- Bun-based JavaScript tooling.
- Split Rust bootstrap and overlay modules.

## Next Milestone: Reminders and Controls

Goal: ship useful hydration and posture reminders before any disruptive interaction.

Tasks:

- Add reminder state types and timer rules.
- Add snooze and dismiss behavior.
- Trigger native notifications and in-overlay alert animation.
- Add tray controls for pause, mute, and quit.
- Persist reminder settings locally.

Definition of done:

- Reminder cadence survives app restart.
- Reminder prompts do not spam after sleep or wake.
- Users can pause or quit from a native control surface.

## Later Milestones

### Native System Awareness

- Implement idle detection.
- Add startup-on-login.
- Add permission checks for macOS accessibility.
- Display supported and unsupported capability states in UI.

### Opt-In Cursor Interaction

- Add Enigo.
- Implement small cursor nudges only.
- Protect with cooldowns, feature flags, and work mode.
- Avoid true drag-and-hold interactions in the first release.

### Packaging and QA

- Add packaging and release automation.
- Validate multi-monitor, high-DPI, full-screen, and sleep/wake behavior.
- Add logging for overlay and permission failures.

## Backlog

- Optional posture detection via webcam with explicit consent.
- Audio cues.
- Multiple goose personalities.
- Analytics only if strictly local and user-visible.

## Risks and Guardrails

- macOS accessibility permissions are the main product risk for cursor interaction.
- Transparent overlay behavior can be fragile on multi-monitor and scaling setups.
- The app must never trap pointer input or feel malicious.
- Performance matters more than visual complexity in the first release.
