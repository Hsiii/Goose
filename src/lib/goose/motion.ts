import type {
  GooseDirection,
  GooseMotionBounds,
  GooseMotionSnapshot,
} from "./types";

const SIDE_PADDING = 56;
const ARRIVAL_DISTANCE = 2;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function usableWidth(bounds: GooseMotionBounds): number {
  return Math.max(bounds.width - SIDE_PADDING * 2, 1);
}

function maxX(bounds: GooseMotionBounds): number {
  return Math.max(bounds.width - SIDE_PADDING, SIDE_PADDING);
}

function pickTargetX(bounds: GooseMotionBounds): number {
  return SIDE_PADDING + Math.random() * usableWidth(bounds);
}

function settleAtFloor(
  snapshot: GooseMotionSnapshot,
  bounds: GooseMotionBounds,
): GooseMotionSnapshot {
  return {
    ...snapshot,
    x: clamp(snapshot.x, SIDE_PADDING, maxX(bounds)),
    y: bounds.floorY,
    targetX: clamp(snapshot.targetX, SIDE_PADDING, maxX(bounds)),
  };
}

function nextIdleState(
  snapshot: GooseMotionSnapshot,
  bounds: GooseMotionBounds,
): GooseMotionSnapshot {
  return {
    ...settleAtFloor(snapshot, bounds),
    targetX: snapshot.x,
    speed: 0,
    state: "idle",
    stateTimerMs: 0,
    stateDurationMs: randomBetween(1400, 3600),
  };
}

function nextInspectState(
  snapshot: GooseMotionSnapshot,
  bounds: GooseMotionBounds,
): GooseMotionSnapshot {
  return {
    ...settleAtFloor(snapshot, bounds),
    targetX: snapshot.x,
    speed: 0,
    state: "inspect",
    stateTimerMs: 0,
    stateDurationMs: randomBetween(900, 2100),
  };
}

function nextHonkState(
  snapshot: GooseMotionSnapshot,
  bounds: GooseMotionBounds,
): GooseMotionSnapshot {
  return {
    ...settleAtFloor(snapshot, bounds),
    targetX: snapshot.x,
    speed: 0,
    state: "honk",
    stateTimerMs: 0,
    stateDurationMs: randomBetween(700, 1200),
  };
}

function nextWalkState(
  snapshot: GooseMotionSnapshot,
  bounds: GooseMotionBounds,
): GooseMotionSnapshot {
  const targetX = pickTargetX(bounds);
  const direction: GooseDirection = targetX >= snapshot.x ? 1 : -1;

  return {
    ...settleAtFloor(snapshot, bounds),
    targetX,
    direction,
    speed: randomBetween(38, 62),
    state: "walk",
    stateTimerMs: 0,
    stateDurationMs: randomBetween(3200, 5400),
  };
}

function nextAmbientState(
  snapshot: GooseMotionSnapshot,
  bounds: GooseMotionBounds,
): GooseMotionSnapshot {
  const roll = Math.random();

  if (roll > 0.76) {
    return nextHonkState(snapshot, bounds);
  }

  if (roll > 0.38) {
    return nextInspectState(snapshot, bounds);
  }

  return nextIdleState(snapshot, bounds);
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
  return settleAtFloor(snapshot, bounds);
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
      Math.abs(nextSnapshot.targetX - nextSnapshot.x) <= ARRIVAL_DISTANCE ||
      nextSnapshot.stateTimerMs >= nextSnapshot.stateDurationMs
    ) {
      return nextAmbientState(nextSnapshot, bounds);
    }

    return settleAtFloor(nextSnapshot, bounds);
  }

  if (nextSnapshot.stateTimerMs < nextSnapshot.stateDurationMs) {
    return settleAtFloor(nextSnapshot, bounds);
  }

  if (nextSnapshot.state === "inspect" || nextSnapshot.state === "honk") {
    return Math.random() > 0.35
      ? nextWalkState(nextSnapshot, bounds)
      : nextIdleState(nextSnapshot, bounds);
  }

  return Math.random() > 0.25
    ? nextWalkState(nextSnapshot, bounds)
    : nextAmbientState(nextSnapshot, bounds);
}
