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

interface Point {
  x: number;
  y: number;
}

interface GoosePose {
  bob: number;
  bodyTilt: number;
  headX: number;
  headY: number;
  neckBend: number;
  beakOpen: number;
  wingLift: number;
  legPhase: number;
  inspect: number;
  alert: number;
}

const atlasPath = join(
  import.meta.dir,
  "../../static/assets/goose_spritesheet.json",
);
const outputPath = join(
  import.meta.dir,
  "../../static/assets/goose_spritesheet.png",
);

const atlas = JSON.parse(readFileSync(atlasPath, "utf8")) as Atlas;

const transparent: Color = { r: 0, g: 0, b: 0, a: 0 };
const outline: Color = { r: 18, g: 18, b: 16, a: 255 };
const feather: Color = { r: 255, g: 255, b: 249, a: 255 };
const featherShade: Color = { r: 226, g: 232, b: 224, a: 255 };
const orange: Color = { r: 232, g: 112, b: 25, a: 255 };
const orangeShade: Color = { r: 175, g: 77, b: 22, a: 255 };

const sheet = new PNG({
  width: atlas.meta.size.w,
  height: atlas.meta.size.h,
  colorType: 6,
});

for (let index = 0; index < sheet.data.length; index += 4) {
  sheet.data[index] = transparent.r;
  sheet.data[index + 1] = transparent.g;
  sheet.data[index + 2] = transparent.b;
  sheet.data[index + 3] = transparent.a;
}

function setPixel(x: number, y: number, color: Color): void {
  if (x < 0 || x >= sheet.width || y < 0 || y >= sheet.height) {
    return;
  }

  const index = (Math.floor(y) * sheet.width + Math.floor(x)) * 4;
  sheet.data[index] = color.r;
  sheet.data[index + 1] = color.g;
  sheet.data[index + 2] = color.b;
  sheet.data[index + 3] = color.a;
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
      setPixel(xx, yy, color);
    }
  }
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
        setPixel(x, y, color);
      }
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
        setPixel(x, y, color);
      }
    }
  }
}

function drawThickLine(
  start: Point,
  end: Point,
  thickness: number,
  color: Color,
): void {
  const minX = Math.floor(Math.min(start.x, end.x) - thickness);
  const maxX = Math.ceil(Math.max(start.x, end.x) + thickness);
  const minY = Math.floor(Math.min(start.y, end.y) - thickness);
  const maxY = Math.ceil(Math.max(start.y, end.y) + thickness);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const t =
        lengthSquared === 0
          ? 0
          : Math.max(
              0,
              Math.min(
                1,
                ((x - start.x) * dx + (y - start.y) * dy) / lengthSquared,
              ),
            );
      const projectionX = start.x + t * dx;
      const projectionY = start.y + t * dy;
      const distance = Math.hypot(x - projectionX, y - projectionY);

      if (distance <= thickness / 2) {
        setPixel(x, y, color);
      }
    }
  }
}

function drawOutlinedLine(
  start: Point,
  end: Point,
  thickness: number,
  fill: Color,
): void {
  drawThickLine(start, end, thickness + 4, outline);
  drawThickLine(start, end, thickness, fill);
}

function drawOutlinedEllipse(
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  fill: Color,
): void {
  fillEllipse(centerX, centerY, radiusX + 3, radiusY + 3, outline);
  fillEllipse(centerX, centerY, radiusX, radiusY, fill);
}

function drawOutlinedPolygon(points: Point[], fill: Color): void {
  const expanded = points.map((point) => ({
    x: point.x + Math.sign(point.x - 64) * 2,
    y: point.y + Math.sign(point.y - 64) * 2,
  }));

  fillPolygon(expanded, outline);
  fillPolygon(points, fill);
}

function drawFoot(x: number, y: number, stride: number): void {
  const toe = x + stride;

  drawThickLine({ x, y }, { x: toe + 9, y: y + 1 }, 6, outline);
  drawThickLine({ x: toe + 2, y }, { x: toe + 12, y: y - 3 }, 4, outline);
  drawThickLine({ x, y }, { x: toe + 8, y: y + 1 }, 3, orange);
  drawThickLine({ x: toe + 2, y }, { x: toe + 10, y: y - 2 }, 2, orange);
}

function drawBeak(
  headX: number,
  headY: number,
  beakOpen: number,
  alert: number,
): void {
  const baseY = headY - 1;
  const topLength = 18 + alert * 2;
  const lowerDrop = 4 + beakOpen * 8;

  drawOutlinedPolygon(
    [
      { x: headX + 12, y: baseY - 4 },
      { x: headX + topLength + 12, y: baseY },
      { x: headX + 12, y: baseY + 5 },
    ],
    orange,
  );

  if (beakOpen > 0.15) {
    drawOutlinedPolygon(
      [
        { x: headX + 11, y: baseY + 4 },
        { x: headX + 24, y: baseY + lowerDrop },
        { x: headX + 10, y: baseY + 10 },
      ],
      orangeShade,
    );
  }
}

function drawGoose(frameX: number, frameY: number, pose: GoosePose): void {
  const originX = frameX;
  const originY = frameY;
  const y = originY + pose.bob + 12;
  const bodyX = originX + 55;
  const bodyY = y + 82 + pose.inspect * 5;
  const headX = originX + 77 + pose.headX + pose.alert * 2;
  const headY = y + 45 + pose.headY - pose.alert * 5 + pose.inspect * 12;
  const neckMidX = originX + 69 + pose.neckBend - pose.inspect * 4;
  const neckMidY = y + 62 + pose.inspect * 8;

  drawFoot(originX + 45, y + 104, Math.round(Math.sin(pose.legPhase) * 8));
  drawFoot(
    originX + 61,
    y + 104,
    Math.round(Math.sin(pose.legPhase + Math.PI) * 8),
  );
  drawOutlinedLine(
    { x: originX + 49, y: y + 94 },
    { x: originX + 49, y: y + 105 },
    4,
    orange,
  );
  drawOutlinedLine(
    { x: originX + 65, y: y + 94 },
    { x: originX + 65, y: y + 105 },
    4,
    orange,
  );

  drawOutlinedPolygon(
    [
      { x: bodyX - 34, y: bodyY - 6 + pose.bodyTilt },
      { x: bodyX - 50, y: bodyY + 2 },
      { x: bodyX - 31, y: bodyY + 9 },
    ],
    feather,
  );
  drawOutlinedEllipse(bodyX, bodyY, 32, 19, feather);
  fillEllipse(bodyX + 12, bodyY + 8, 18, 7, featherShade);

  drawOutlinedLine(
    { x: bodyX + 10, y: bodyY - 15 },
    { x: neckMidX, y: neckMidY },
    13,
    feather,
  );
  drawOutlinedLine(
    { x: neckMidX, y: neckMidY },
    { x: headX - 8, y: headY + 8 },
    13,
    feather,
  );

  drawOutlinedEllipse(headX, headY, 15, 13, feather);
  drawBeak(headX, headY, pose.beakOpen, pose.alert);

  fillEllipse(headX - 2, headY - 4, 2, 2, outline);
  fillRect(headX - 3, headY - 5, 2, 2, outline);

  const wingTop = bodyY - 2 - pose.wingLift * 6;
  drawOutlinedPolygon(
    [
      { x: bodyX - 6, y: wingTop },
      { x: bodyX + 18, y: bodyY + 3 },
      { x: bodyX - 1, y: bodyY + 14 + pose.wingLift * 2 },
    ],
    feather,
  );
  drawThickLine(
    { x: bodyX + 1, y: wingTop + 5 },
    { x: bodyX + 14, y: bodyY + 4 },
    2,
    featherShade,
  );
}

function poseForFrame(frameName: string): GoosePose {
  const index = Number(frameName.match(/_(\d+)$/)?.[1] ?? 0);
  const cycle = (index % 8) / 8;

  if (frameName.startsWith("goose_walk_")) {
    return {
      bob: Math.round(Math.sin(cycle * Math.PI * 2) * 2),
      bodyTilt: Math.round(Math.sin(cycle * Math.PI * 2) * 2),
      headX: Math.round(Math.cos(cycle * Math.PI * 2) * 2),
      headY: Math.round(Math.sin(cycle * Math.PI * 2) * 2),
      neckBend: Math.round(Math.sin(cycle * Math.PI * 2) * 2),
      beakOpen: 0,
      wingLift: 0.15 + Math.max(0, Math.sin(cycle * Math.PI * 2)) * 0.3,
      legPhase: cycle * Math.PI * 2,
      inspect: 0,
      alert: 0,
    };
  }

  if (frameName.startsWith("goose_reminders_")) {
    const honk = index <= 5;

    return {
      bob: honk ? Math.round(Math.sin(cycle * Math.PI * 2) * 2) : -2,
      bodyTilt: 0,
      headX: honk ? Math.round(Math.sin(cycle * Math.PI * 2) * 2) : 1,
      headY: honk ? Math.round(Math.cos(cycle * Math.PI * 2) * 2) : -2,
      neckBend: honk ? 2 : 0,
      beakOpen: honk
        ? 0.35 + Math.max(0, Math.sin(cycle * Math.PI * 2)) * 0.65
        : 0.2,
      wingLift: honk ? 0.4 : 0.8,
      legPhase: 0,
      inspect: 0,
      alert: honk ? 0.15 : 1,
    };
  }

  const actionSet = Math.floor(index / 4);

  if (actionSet === 2 || actionSet === 3) {
    return {
      bob: Math.round(Math.sin(cycle * Math.PI * 2) * 1),
      bodyTilt: 0,
      headX: -6 + Math.round(Math.sin(cycle * Math.PI * 2) * 3),
      headY: 2 + Math.round(Math.cos(cycle * Math.PI * 2) * 2),
      neckBend: -4,
      beakOpen: 0,
      wingLift: 0.1,
      legPhase: 0,
      inspect: 0.75,
      alert: 0,
    };
  }

  if (actionSet >= 4) {
    return {
      bob: -1,
      bodyTilt: 0,
      headX: 1,
      headY: -1,
      neckBend: 1,
      beakOpen: index % 2 === 0 ? 0.65 : 0.15,
      wingLift: 0.45,
      legPhase: 0,
      inspect: 0,
      alert: 0.2,
    };
  }

  return {
    bob: Math.round(Math.sin(cycle * Math.PI * 2) * 1),
    bodyTilt: 0,
    headX: Math.round(Math.sin(cycle * Math.PI * 2) * 1),
    headY: Math.round(Math.cos(cycle * Math.PI * 2) * 1),
    neckBend: Math.round(Math.sin(cycle * Math.PI * 2) * 1),
    beakOpen: 0,
    wingLift: Math.max(0, Math.sin(cycle * Math.PI * 2)) * 0.15,
    legPhase: 0,
    inspect: 0,
    alert: 0,
  };
}

for (const [frameName, { frame }] of Object.entries(atlas.frames)) {
  drawGoose(frame.x, frame.y, poseForFrame(frameName));
}

writeFileSync(outputPath, PNG.sync.write(sheet));
console.log(
  `Rebuilt ${Object.keys(atlas.frames).length} goose frames at ${outputPath}`,
);
