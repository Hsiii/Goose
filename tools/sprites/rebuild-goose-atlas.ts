import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PNG } from "pngjs";

interface AtlasFrame {
  frame: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

interface Atlas {
  frames: Record<string, AtlasFrame>;
  meta: {
    image: string;
    size: {
      w: number;
      h: number;
    };
  };
}

interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

interface Pose {
  dx: number;
  dy: number;
  shear: number;
  scaleX: number;
  scaleY: number;
  footStride: number | null;
  openBeak: number;
  hydrationDrop: number;
  rearView?: number;
}

interface Placement {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  shear: number;
}

const atlasPath = join(
  import.meta.dir,
  "../../static/assets/goose_spritesheet.json",
);
const referencePath = join(import.meta.dir, "reference-goose.png");
const outputPath = join(
  import.meta.dir,
  "../../static/assets/goose_spritesheet.png",
);

const atlas = JSON.parse(readFileSync(atlasPath, "utf8")) as Atlas;
const reference = PNG.sync.read(readFileSync(referencePath));
const sheet = new PNG({
  width: atlas.meta.size.w,
  height: atlas.meta.size.h,
  colorType: 6,
});

const transparent: Color = { r: 0, g: 0, b: 0, a: 0 };
const outline: Color = { r: 0, g: 0, b: 0, a: 255 };
const orange: Color = { r: 224, g: 94, b: 24, a: 255 };
const orangeShade: Color = { r: 151, g: 67, b: 33, a: 255 };
const featherWhite: Color = { r: 248, g: 248, b: 244, a: 255 };
const featherShade: Color = { r: 176, g: 184, b: 188, a: 255 };
const water: Color = { r: 77, g: 165, b: 236, a: 255 };
const waterShade: Color = { r: 31, g: 103, b: 185, a: 255 };

const idlePose: Pose = {
  dx: 0,
  dy: 0,
  shear: 0,
  scaleX: 1,
  scaleY: 1,
  footStride: null,
  openBeak: 0,
  hydrationDrop: 0,
};

for (let index = 0; index < sheet.data.length; index += 4) {
  sheet.data[index] = transparent.r;
  sheet.data[index + 1] = transparent.g;
  sheet.data[index + 2] = transparent.b;
  sheet.data[index + 3] = transparent.a;
}

function colorKey(color: Color): string {
  return `${color.r},${color.g},${color.b}`;
}

function colorDistance(left: Color, right: Color): number {
  return Math.hypot(left.r - right.r, left.g - right.g, left.b - right.b);
}

function getReferencePixel(x: number, y: number): Color {
  const index = (y * reference.width + x) * 4;

  return {
    r: reference.data[index],
    g: reference.data[index + 1],
    b: reference.data[index + 2],
    a: reference.data[index + 3],
  };
}

function setSheetPixel(x: number, y: number, color: Color): void {
  if (x < 0 || x >= sheet.width || y < 0 || y >= sheet.height) {
    return;
  }

  const index = (Math.floor(y) * sheet.width + Math.floor(x)) * 4;
  sheet.data[index] = color.r;
  sheet.data[index + 1] = color.g;
  sheet.data[index + 2] = color.b;
  sheet.data[index + 3] = color.a;
}

function getBorderBackgroundColors(): Color[] {
  const counts = new Map<string, { color: Color; count: number }>();

  for (let y = 0; y < reference.height; y += 1) {
    for (let x = 0; x < reference.width; x += 1) {
      if (
        x > 4 &&
        x < reference.width - 5 &&
        y > 4 &&
        y < reference.height - 5
      ) {
        continue;
      }

      const color = getReferencePixel(x, y);
      const key = colorKey(color);
      const existing = counts.get(key);
      counts.set(key, {
        color,
        count: existing ? existing.count + 1 : 1,
      });
    }
  }

  return [...counts.values()]
    .sort((left, right) => right.count - left.count)
    .slice(0, 2)
    .map(({ color }) => color);
}

const backgroundColors = getBorderBackgroundColors();

function isCheckerBackground(color: Color): boolean {
  return backgroundColors.some(
    (backgroundColor) => colorDistance(color, backgroundColor) < 22,
  );
}

function isShadowOrFloor(color: Color, y: number): boolean {
  const maxChannel = Math.max(color.r, color.g, color.b);
  const minChannel = Math.min(color.r, color.g, color.b);
  const neutralDark = maxChannel - minChannel < 14 && maxChannel > 22;

  return neutralDark && maxChannel < 96 && y > reference.height * 0.58;
}

function isSpritePixel(x: number, y: number): boolean {
  const color = getReferencePixel(x, y);

  if (color.a === 0 || isCheckerBackground(color)) {
    return false;
  }

  return !isShadowOrFloor(color, y);
}

function findBounds(predicate: (x: number, y: number) => boolean): Box {
  let minX = reference.width;
  let minY = reference.height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < reference.height; y += 1) {
    for (let x = 0; x < reference.width; x += 1) {
      if (!predicate(x, y)) {
        continue;
      }

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

const spriteBounds = findBounds(isSpritePixel);
const beakBounds = findBounds((x, y) => {
  const color = getReferencePixel(x, y);

  return (
    isSpritePixel(x, y) &&
    y < spriteBounds.y + spriteBounds.height * 0.45 &&
    color.r > 140 &&
    color.g > 45 &&
    color.g < 150 &&
    color.b < 80
  );
});
const feetBounds = findBounds((x, y) => {
  const color = getReferencePixel(x, y);

  return (
    isSpritePixel(x, y) &&
    y > spriteBounds.y + spriteBounds.height * 0.68 &&
    color.r > 120 &&
    color.g > 35 &&
    color.g < 140 &&
    color.b < 90
  );
});

function isBeakPixel(x: number, y: number): boolean {
  const color = getReferencePixel(x, y);

  return (
    x >= beakBounds.x &&
    x <= beakBounds.x + beakBounds.width &&
    y >= beakBounds.y &&
    y <= beakBounds.y + beakBounds.height &&
    color.r > 140 &&
    color.g > 45 &&
    color.g < 150 &&
    color.b < 90
  );
}

function isFootPixel(x: number, y: number): boolean {
  const color = getReferencePixel(x, y);

  return (
    y >= feetBounds.y &&
    color.r > 120 &&
    color.g > 35 &&
    color.g < 150 &&
    color.b < 100
  );
}

function fillRect(
  x: number,
  y: number,
  width: number,
  height: number,
  color: Color,
): void {
  for (let yy = Math.floor(y); yy < y + height; yy += 1) {
    for (let xx = Math.floor(x); xx < x + width; xx += 1) {
      setSheetPixel(xx, yy, color);
    }
  }
}

function fillPolygon(points: Point[], color: Color): void {
  const minX = Math.floor(Math.min(...points.map((point) => point.x)));
  const maxX = Math.ceil(Math.max(...points.map((point) => point.x)));
  const minY = Math.floor(Math.min(...points.map((point) => point.y)));
  const maxY = Math.ceil(Math.max(...points.map((point) => point.y)));

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      let inside = false;

      for (
        let current = 0, previous = points.length - 1;
        current < points.length;
        previous = current, current += 1
      ) {
        const currentPoint = points[current];
        const previousPoint = points[previous];
        const crosses =
          currentPoint.y > y !== previousPoint.y > y &&
          x <
            ((previousPoint.x - currentPoint.x) * (y - currentPoint.y)) /
              (previousPoint.y - currentPoint.y) +
              currentPoint.x;

        if (crosses) {
          inside = !inside;
        }
      }

      if (inside) {
        setSheetPixel(x, y, color);
      }
    }
  }
}

function mapPoint(point: Point, placement: Placement): Point {
  const localX = point.x - spriteBounds.x;
  const localY = point.y - spriteBounds.y;

  return {
    x:
      placement.x +
      localX * placement.scaleX +
      placement.shear * (localY - spriteBounds.height / 2) * placement.scaleY,
    y: placement.y + localY * placement.scaleY,
  };
}

function drawOpenBeak(placement: Placement, amount: number): void {
  if (amount <= 0) {
    return;
  }

  const beakStart = mapPoint({ x: beakBounds.x, y: beakBounds.y }, placement);
  const beakEnd = mapPoint(
    {
      x: beakBounds.x + beakBounds.width,
      y: beakBounds.y + beakBounds.height,
    },
    placement,
  );
  const hingeX = Math.round(beakStart.x + 3);
  const hingeY = Math.round(beakEnd.y - 2);
  const tipX = Math.round(beakEnd.x - 1);
  const tipY = Math.round(beakEnd.y + 3 + amount * 12);

  fillPolygon(
    [
      { x: hingeX - 1, y: hingeY - 1 },
      { x: tipX + 3, y: tipY },
      { x: hingeX - 2, y: hingeY + 7 },
    ],
    outline,
  );
  fillPolygon(
    [
      { x: hingeX, y: hingeY },
      { x: tipX, y: tipY },
      { x: hingeX, y: hingeY + 5 },
    ],
    amount > 0.6 ? orangeShade : orange,
  );
}

function drawFoot(x: number, y: number, stride: number): void {
  fillRect(x - 2, y - 9, 5, 10, outline);
  fillRect(x - 1, y - 8, 3, 8, orange);
  fillRect(x + stride - 2, y - 2, 13, 5, outline);
  fillRect(x + stride, y - 1, 10, 3, orange);
}

function drawPoseFeet(placement: Placement, pose: Pose): void {
  if (pose.footStride === null) {
    return;
  }

  const leftFoot = mapPoint(
    {
      x: feetBounds.x + feetBounds.width * 0.25,
      y: feetBounds.y + feetBounds.height,
    },
    placement,
  );
  const rightFoot = mapPoint(
    {
      x: feetBounds.x + feetBounds.width * 0.72,
      y: feetBounds.y + feetBounds.height,
    },
    placement,
  );

  drawFoot(Math.round(leftFoot.x), Math.round(leftFoot.y), pose.footStride);
  drawFoot(Math.round(rightFoot.x), Math.round(rightFoot.y), -pose.footStride);
}

function fillEllipse(
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  color: Color,
): void {
  const minX = Math.floor(centerX - radiusX);
  const maxX = Math.ceil(centerX + radiusX);
  const minY = Math.floor(centerY - radiusY);
  const maxY = Math.ceil(centerY + radiusY);

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = (x + 0.5 - centerX) / radiusX;
      const dy = (y + 0.5 - centerY) / radiusY;

      if (dx * dx + dy * dy <= 1) {
        setSheetPixel(x, y, color);
      }
    }
  }
}

function drawRearTurnDetails(placement: Placement, amount = 0): void {
  if (amount <= 0) {
    return;
  }

  const rear = mapPoint(
    {
      x: spriteBounds.x + spriteBounds.width * 0.28,
      y: spriteBounds.y + spriteBounds.height * 0.72,
    },
    placement,
  );
  const centerX = Math.round(rear.x + amount * 4);
  const centerY = Math.round(rear.y + amount * 2);
  const radiusX = 9 + Math.round(amount * 4);
  const radiusY = 8 + Math.round(amount * 2);

  fillEllipse(centerX, centerY, radiusX + 2, radiusY + 2, outline);
  fillEllipse(centerX, centerY, radiusX, radiusY, featherWhite);
  fillPolygon(
    [
      { x: centerX + 2, y: centerY - radiusY + 3 },
      { x: centerX + 6, y: centerY - 1 },
      { x: centerX + 3, y: centerY + radiusY - 3 },
      { x: centerX + 1, y: centerY + radiusY - 4 },
      { x: centerX + 3, y: centerY },
      { x: centerX, y: centerY - radiusY + 4 },
    ],
    featherShade,
  );

  const tailBaseX = centerX - radiusX + 1;
  const tailBaseY = centerY - 1;
  const tailReach = 9 + Math.round(amount * 5);

  fillPolygon(
    [
      { x: tailBaseX, y: tailBaseY - 7 },
      { x: tailBaseX - tailReach, y: tailBaseY - 13 },
      { x: tailBaseX - 3, y: tailBaseY },
    ],
    outline,
  );
  fillPolygon(
    [
      { x: tailBaseX + 2, y: tailBaseY - 5 },
      { x: tailBaseX - tailReach + 3, y: tailBaseY - 10 },
      { x: tailBaseX - 1, y: tailBaseY },
    ],
    featherWhite,
  );
  fillPolygon(
    [
      { x: tailBaseX, y: tailBaseY + 2 },
      { x: tailBaseX - tailReach, y: tailBaseY + 7 },
      { x: tailBaseX - 3, y: tailBaseY - 3 },
    ],
    outline,
  );
  fillPolygon(
    [
      { x: tailBaseX + 2, y: tailBaseY + 1 },
      { x: tailBaseX - tailReach + 3, y: tailBaseY + 5 },
      { x: tailBaseX - 1, y: tailBaseY - 2 },
    ],
    featherWhite,
  );
}

function drawHydrationDrop(placement: Placement, amount: number): void {
  if (amount <= 0) {
    return;
  }

  const beakEnd = mapPoint(
    {
      x: beakBounds.x + beakBounds.width,
      y: beakBounds.y + beakBounds.height * 0.55,
    },
    placement,
  );
  const x = Math.round(beakEnd.x + 10);
  const y = Math.round(beakEnd.y + 9 - amount * 3);
  const height = 11 + Math.round(amount * 5);

  fillPolygon(
    [
      { x, y: y - height },
      { x: x + 10, y: y - 2 },
      { x, y: y + 8 },
      { x: x - 10, y: y - 2 },
    ],
    outline,
  );
  fillPolygon(
    [
      { x, y: y - height + 2 },
      { x: x + 7, y: y - 2 },
      { x, y: y + 5 },
      { x: x - 7, y: y - 2 },
    ],
    water,
  );
  fillEllipse(x + 3, y - 2, 3, 4, waterShade);
}

function drawReferenceSprite(frame: AtlasFrame["frame"], pose: Pose): void {
  const targetHeight = 110;
  const targetWidth = 82;
  const scale = Math.min(
    targetHeight / spriteBounds.height,
    targetWidth / spriteBounds.width,
  );
  const scaledWidth = spriteBounds.width * scale * pose.scaleX;
  const scaledHeight = spriteBounds.height * scale * pose.scaleY;
  const placement: Placement = {
    x: frame.x + (frame.w - scaledWidth) / 2 + pose.dx,
    y: frame.y + frame.h - 7 - scaledHeight + pose.dy,
    scaleX: scale * pose.scaleX,
    scaleY: scale * pose.scaleY,
    shear: pose.shear,
  };

  const minX = Math.floor(placement.x - Math.abs(pose.shear) * 24);
  const maxX = Math.ceil(placement.x + scaledWidth + Math.abs(pose.shear) * 24);
  const minY = Math.floor(placement.y);
  const maxY = Math.ceil(placement.y + scaledHeight);

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const localY = (y - placement.y) / placement.scaleY;
      const localX =
        (x -
          placement.x -
          placement.shear *
            (localY - spriteBounds.height / 2) *
            placement.scaleY) /
        placement.scaleX;
      const sourceX = spriteBounds.x + Math.round(localX);
      const sourceY = spriteBounds.y + Math.round(localY);

      if (
        sourceX < spriteBounds.x ||
        sourceX >= spriteBounds.x + spriteBounds.width ||
        sourceY < spriteBounds.y ||
        sourceY >= spriteBounds.y + spriteBounds.height ||
        !isSpritePixel(sourceX, sourceY) ||
        (pose.footStride !== null && isFootPixel(sourceX, sourceY)) ||
        ((pose.rearView ?? 0) > 0 && isBeakPixel(sourceX, sourceY))
      ) {
        continue;
      }

      setSheetPixel(x, y, getReferencePixel(sourceX, sourceY));
    }
  }

  drawPoseFeet(placement, pose);
  drawRearTurnDetails(placement, pose.rearView);
  drawOpenBeak(placement, pose.openBeak);
  drawHydrationDrop(placement, pose.hydrationDrop);
}

function poseForFrame(frameName: string): Pose {
  const index = Number(frameName.match(/_(\d+)$/)?.[1] ?? 0);
  const cycle = (index % 8) / 8;
  const wave = Math.sin(cycle * Math.PI * 2);
  const counterWave = Math.cos(cycle * Math.PI * 2);

  if (frameName.startsWith("goose_walk_")) {
    if (index % 4 === 0) {
      return idlePose;
    }

    return {
      dx: Math.round(counterWave * 4),
      dy: Math.round(wave * 4),
      shear: wave * 0.11,
      scaleX: 1,
      scaleY: 1,
      footStride: Math.round(wave * 9),
      openBeak: 0,
      hydrationDrop: 0,
    };
  }

  if (frameName.startsWith("goose_reminders_")) {
    const reminderPose = [
      idlePose,
      { ...idlePose, dy: -2, shear: 0.05, scaleY: 1.03, openBeak: 0.45 },
      { ...idlePose, dy: -4, shear: 0.08, scaleY: 1.05, openBeak: 1 },
      { ...idlePose, dy: -3, shear: 0.04, scaleY: 1.04, openBeak: 0.85 },
      { ...idlePose, dy: -1, shear: 0.02, openBeak: 0.35 },
      idlePose,
      idlePose,
      { ...idlePose, dx: -1, dy: 1, shear: -0.06, hydrationDrop: 0.65 },
      { ...idlePose, dx: -2, dy: 2, shear: -0.1, hydrationDrop: 1 },
      { ...idlePose, dx: -1, dy: 1, shear: -0.06, hydrationDrop: 0.75 },
      idlePose,
      { ...idlePose, dy: -2, shear: 0.05, scaleY: 1.03, openBeak: 0.55 },
      { ...idlePose, dy: -4, shear: 0.08, scaleY: 1.05, openBeak: 0.95 },
      idlePose,
    ][index];

    return reminderPose ?? idlePose;
  }

  const actionSet = Math.floor(index / 4);
  const actionFrame = index % 4;

  if (actionSet === 0) {
    return (
      [
        idlePose,
        { ...idlePose, dy: -2, shear: 0.025, scaleY: 1.02 },
        { ...idlePose, dy: -4, shear: -0.025, scaleY: 1.04 },
        idlePose,
      ][actionFrame] ?? idlePose
    );
  }

  if (actionSet === 1) {
    const turnPose = [
      idlePose,
      {
        ...idlePose,
        dx: -2,
        dy: 1,
        shear: -0.12,
        scaleX: 0.92,
        scaleY: 1.03,
        rearView: 0.45,
      },
      {
        ...idlePose,
        dx: 2,
        dy: 2,
        shear: 0.08,
        scaleX: 0.82,
        scaleY: 1.05,
        rearView: 1,
      },
      idlePose,
    ][actionFrame];

    return turnPose ?? idlePose;
  }

  if (actionSet === 2 || actionSet === 3) {
    return (
      [
        idlePose,
        { ...idlePose, dx: 4, dy: 2, shear: -0.16, scaleY: 0.98 },
        { ...idlePose, dx: 7, dy: 5, shear: -0.24, scaleY: 0.94 },
        idlePose,
      ][actionFrame] ?? idlePose
    );
  }

  if (actionSet >= 4) {
    return {
      ...idlePose,
      dy: actionFrame === 0 || actionFrame === 3 ? 0 : -3,
      shear: actionFrame === 0 || actionFrame === 3 ? 0 : wave * 0.07,
      openBeak:
        actionFrame === 0 || actionFrame === 3
          ? 0
          : index % 2 === 0
            ? 0.75
            : 0.25,
    };
  }

  return idlePose;
}

for (const [frameName, { frame }] of Object.entries(atlas.frames)) {
  drawReferenceSprite(frame, poseForFrame(frameName));
}

writeFileSync(outputPath, PNG.sync.write(sheet));
console.log(
  `Rebuilt ${Object.keys(atlas.frames).length} reference-locked goose frames at ${outputPath}`,
);
