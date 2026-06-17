import type { Spritesheet, Texture } from "pixi.js";
import type { GooseAnimationKey } from "./types";

export const GOOSE_ATLAS_URL = "/assets/goose_spritesheet.json";

export const GOOSE_RENDERING = {
  minimumViewportWidth: 220,
  minimumViewportHeight: 180,
  spriteScale: 0.6,
  floorOffset: 120,
  animationSpeed: {
    idle: 0.07,
    walk: 0.11,
    inspect: 0.08,
    honk: 0.1,
    alert: 0.12,
  },
} as const;

const animationFrames = {
  idle: [
    "goose_actions_0",
    "goose_actions_1",
    "goose_actions_2",
    "goose_actions_3",
  ],
  walk: [
    "goose_walk_0",
    "goose_walk_1",
    "goose_walk_2",
    "goose_walk_3",
    "goose_walk_4",
    "goose_walk_5",
  ],
  inspect: [
    "goose_actions_8",
    "goose_actions_9",
    "goose_actions_10",
    "goose_actions_11",
  ],
  honk: [
    "goose_reminders_0",
    "goose_reminders_1",
    "goose_reminders_2",
    "goose_reminders_3",
    "goose_reminders_4",
  ],
  alert: [
    "goose_reminders_6",
    "goose_reminders_7",
    "goose_reminders_8",
    "goose_reminders_9",
  ],
} satisfies Record<GooseAnimationKey, string[]>;

export type GooseAnimationSet = Record<GooseAnimationKey, Texture[]>;

export function buildGooseAnimations(sheet: Spritesheet): GooseAnimationSet {
  return Object.fromEntries(
    Object.entries(animationFrames).map(([animationName, frameNames]) => [
      animationName,
      frameNames.map((frameName) => {
        const texture = sheet.textures[frameName];

        if (!texture) {
          throw new Error(`Missing goose sprite frame: ${frameName}`);
        }

        return texture;
      }),
    ]),
  ) as GooseAnimationSet;
}
