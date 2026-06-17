export type GooseDirection = -1 | 1;
export type GooseMotionState = "idle" | "walk" | "inspect" | "honk";
export type GooseAnimationKey = GooseMotionState | "alert";

export interface BootstrapState {
  appName: string;
  platform: string;
  hydrationIntervalMinutes: number;
  postureIntervalMinutes: number;
  cursorInteractionsEnabled: boolean;
  overlayMode: string;
  nextMilestone: string;
}

export interface GooseMotionBounds {
  width: number;
  height: number;
  floorY: number;
}

export interface GooseMotionSnapshot {
  x: number;
  y: number;
  targetX: number;
  speed: number;
  direction: GooseDirection;
  state: GooseMotionState;
  stateTimerMs: number;
  stateDurationMs: number;
  gaitPhase: number;
}
