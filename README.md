# Goose Overlay

Cross-platform desktop goose built with Tauri 2, Rust, and SvelteKit. The product goal is a lightweight overlay pet that can animate on screen, schedule hydration and posture reminders, and later add opt-in system interactions like cursor nudges.

## Current Status

The repository contains the initial desktop scaffold, a documented long-term implementation plan, and a first overlay prototype screen wired to a Rust bootstrap command.

## Stack

- Tauri 2 for the desktop shell
- Rust for native commands and OS integration
- SvelteKit for the settings and overlay UI
- Planned PixiJS integration for sprite rendering

## Development

Install dependencies:

```bash
npm install
```

Run the desktop app:

```bash
npm run tauri dev
```

Run frontend checks:

```bash
npm run check
```

## Planning

The long-term agent execution plan lives in `docs/IMPLEMENTATION_PLAN.md`.
