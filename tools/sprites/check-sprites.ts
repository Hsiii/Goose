import { readFileSync } from "node:fs";
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

const atlasPath = join(
  import.meta.dir,
  "../../static/assets/goose_spritesheet.json",
);
const atlas = JSON.parse(readFileSync(atlasPath, "utf8")) as Atlas;
const spriteSheetPath = join(
  import.meta.dir,
  `../../static/assets/${atlas.meta.image}`,
);
const spriteSheet = PNG.sync.read(readFileSync(spriteSheetPath));

const requiredGroups = {
  goose_walk: 4,
  goose_actions: 8,
  goose_reminders: 6,
} as const;

const failures: string[] = [];

if (
  spriteSheet.width !== atlas.meta.size.w ||
  spriteSheet.height !== atlas.meta.size.h
) {
  failures.push(
    `PNG is ${spriteSheet.width}x${spriteSheet.height}, expected ${atlas.meta.size.w}x${atlas.meta.size.h}`,
  );
}

function alphaAt(x: number, y: number): number {
  const index = (y * spriteSheet.width + x) * 4;
  return spriteSheet.data[index + 3] ?? 0;
}

for (const [group, minimumFrames] of Object.entries(requiredGroups)) {
  const frameCount = Object.keys(atlas.frames).filter((frameName) =>
    frameName.startsWith(`${group}_`),
  ).length;

  if (frameCount < minimumFrames) {
    failures.push(
      `${group} has ${frameCount} frame(s), expected at least ${minimumFrames}`,
    );
  }
}

for (const [frameName, { frame }] of Object.entries(atlas.frames)) {
  const withinWidth = frame.x >= 0 && frame.x + frame.w <= atlas.meta.size.w;
  const withinHeight = frame.y >= 0 && frame.y + frame.h <= atlas.meta.size.h;

  if (!withinWidth || !withinHeight) {
    failures.push(`${frameName} is outside atlas bounds`);
  }

  if (frame.w !== 128 || frame.h !== 128) {
    failures.push(`${frameName} is ${frame.w}x${frame.h}, expected 128x128`);
  }

  let opaquePixels = 0;
  let touchesEdge = false;

  for (let y = frame.y; y < frame.y + frame.h; y += 1) {
    for (let x = frame.x; x < frame.x + frame.w; x += 1) {
      if (alphaAt(x, y) === 0) {
        continue;
      }

      opaquePixels += 1;

      if (
        x === frame.x ||
        x === frame.x + frame.w - 1 ||
        y === frame.y ||
        y === frame.y + frame.h - 1
      ) {
        touchesEdge = true;
      }
    }
  }

  if (opaquePixels < 500) {
    failures.push(`${frameName} has too little visible sprite coverage`);
  }

  if (touchesEdge) {
    failures.push(`${frameName} has opaque pixels touching the frame edge`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(
  `Sprite atlas OK: ${Object.keys(atlas.frames).length} frames in ${atlas.meta.image}`,
);
