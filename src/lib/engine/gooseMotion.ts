import type {
  GooseDirection,
  GooseMotionBounds,
  GooseMotionSnapshot,
} from "$lib/types";

const SIDE_PADDING = 56;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function usableWidth(bounds: GooseMotionBounds): number {
  return Math.max(bounds.width - SIDE_PADDING * 2, 1);
}

function pickTargetX(bounds: GooseMotionBounds): number {
  return SIDE_PADDING + Math.random() * usableWidth(bounds);
}

function nextIdleState(
  snapshot: GooseMotionSnapshot,
  bounds: GooseMotionBounds,
): GooseMotionSnapshot {
  return {
    ...snapshot,
    x: clamp(snapshot.x, SIDE_PADDING, bounds.width - SIDE_PADDING),
    y: bounds.floorY,
    targetX: snapshot.x,
    speed: 0,
    state: "idle",
    stateTimerMs: 0,
    stateDurationMs: 1400 + Math.random() * 2200,
  };
}

function nextInspectState(
  snapshot: GooseMotionSnapshot,
  bounds: GooseMotionBounds,
): GooseMotionSnapshot {
  return {
    ...snapshot,
    x: clamp(snapshot.x, SIDE_PADDING, bounds.width - SIDE_PADDING),
    y: bounds.floorY,
    targetX: snapshot.x,
    speed: 0,
    state: "inspect",
    stateTimerMs: 0,
    stateDurationMs: 900 + Math.random() * 1200,
  };
}

function nextWalkState(
  snapshot: GooseMotionSnapshot,
  bounds: GooseMotionBounds,
): GooseMotionSnapshot {
  const targetX = pickTargetX(bounds);
  const direction: GooseDirection = targetX >= snapshot.x ? 1 : -1;

  return {
    ...snapshot,
    x: clamp(snapshot.x, SIDE_PADDING, bounds.width - SIDE_PADDING),
    y: bounds.floorY,
    targetX,
    direction,
    speed: 38 + Math.random() * 24,
    state: "walk",
    stateTimerMs: 0,
    stateDurationMs: 3200 + Math.random() * 2200,
  };
}

export function createInitialGooseMotion(
  bounds: GooseMotionBounds,
): GooseMotionSnapshot {
  const initialX = SIDE_PADDING + usableWidth(bounds) * 0.3;

  return {
    x: initialX,
    y: bounds.floorY,
    targetX: initialX,
    speed: 0,
    direction: 1,
    state: "idle",
    stateTimerMs: 0,
    stateDurationMs: 1600,
    gaitPhase: 0,
  };
}

export function reconcileGooseMotionBounds(
  snapshot: GooseMotionSnapshot,
  bounds: GooseMotionBounds,
): GooseMotionSnapshot {
  const maxX = Math.max(bounds.width - SIDE_PADDING, SIDE_PADDING);

  return {
    ...snapshot,
    x: clamp(snapshot.x, SIDE_PADDING, maxX),
    targetX: clamp(snapshot.targetX, SIDE_PADDING, maxX),
    y: bounds.floorY,
  };
}

export function tickGooseMotion(
  snapshot: GooseMotionSnapshot,
  deltaMs: number,
  bounds: GooseMotionBounds,
): GooseMotionSnapshot {
  const deltaSeconds = deltaMs / 1000;
  let nextSnapshot: GooseMotionSnapshot = {
    ...snapshot,
    y: bounds.floorY,
    stateTimerMs: snapshot.stateTimerMs + deltaMs,
    gaitPhase:
      snapshot.gaitPhase +
      deltaMs *
        (snapshot.state === "walk"
          ? 0.013
          : snapshot.state === "inspect"
            ? 0.0045
            : 0.0028),
  };

  if (nextSnapshot.state === "walk") {
    const distance = nextSnapshot.targetX - nextSnapshot.x;
    const direction: GooseDirection = distance >= 0 ? 1 : -1;
    const travel = Math.min(
      Math.abs(distance),
      nextSnapshot.speed * deltaSeconds,
    );

    nextSnapshot = {
      ...nextSnapshot,
      direction,
      x: nextSnapshot.x + direction * travel,
    };

    if (
      Math.abs(nextSnapshot.targetX - nextSnapshot.x) <= 2 ||
      nextSnapshot.stateTimerMs >= nextSnapshot.stateDurationMs
    ) {
      return Math.random() > 0.55
        ? nextIdleState(nextSnapshot, bounds)
        : nextInspectState(nextSnapshot, bounds);
    }

    return reconcileGooseMotionBounds(nextSnapshot, bounds);
  }

  if (nextSnapshot.stateTimerMs < nextSnapshot.stateDurationMs) {
    return reconcileGooseMotionBounds(nextSnapshot, bounds);
  }

  if (nextSnapshot.state === "inspect") {
    return Math.random() > 0.35
      ? nextWalkState(nextSnapshot, bounds)
      : nextIdleState(nextSnapshot, bounds);
  }

  return Math.random() > 0.25
    ? nextWalkState(nextSnapshot, bounds)
    : nextInspectState(nextSnapshot, bounds);
}
