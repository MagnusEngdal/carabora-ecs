import "./style.css";
import { createEcs } from "carabora-ecs";
import block from "./assets/block.png";
import bricks from "./assets/bg.png";
import { boxCollider } from "./collision";

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!;
canvas.height = 300;
canvas.width = 300;
ctx.imageSmoothingEnabled = false;
document.body.appendChild(canvas);

const img = document.createElement("img");
const bg = document.createElement("img");
img.src = block;
bg.src = bricks;

const ecs = createEcs();

interface Position {
  x: number;
  y: number;
}
const Position = ecs.component("pos");

interface Velocity {
  x: number;
  y: number;
}
const Velocity = ecs.component("vel");

interface Dimensions {
  width: number;
  height: number;
}
const Dimensions = ecs.component("dimensions");

ecs.system<{ pos: Position; vel: Velocity; dimensions: Dimensions }>({
  update: ({
    id,
    c: {
      pos,
      vel,
      dimensions: { width, height },
    },
    entities,
  }) => {
    for (let e of entities) {
      if (e.id !== id) {
        const col = boxCollider(
          pos.x,
          pos.y,
          width,
          height,
          e.components.pos.x,
          e.components.pos.y,
          e.components.dimensions.width,
          e.components.dimensions.height
        );
        if (col.collision) {
          switch (col.direction) {
            case "top": {
              pos.y += col.offset;
              const velY = vel.y;
              vel.y = e.components.vel.y;
              e.components.vel.y = velY;
              break;
            }
            case "bottom": {
              pos.y -= col.offset;
              const velY = vel.y;
              vel.y = e.components.vel.y;
              e.components.vel.y = velY;
              break;
            }
            case "left": {
              pos.x += col.offset;
              let velX = vel.x;
              vel.x = e.components.vel.x;
              e.components.vel.x = velX;
              break;
            }
            case "right": {
              pos.x -= col.offset;
              let velX = vel.x;
              vel.x = e.components.vel.x;
              e.components.vel.x = velX;
              break;
            }
          }
        }
      }
    }
    if (pos.x > 300 + width) {
      pos.x = -width * 2;
    }
    if (pos.x < -width * 2) {
      pos.x = 300 + width;
    }
    if (pos.y > 300 + height) {
      pos.y = -height * 2;
    }
    if (pos.y < -height * 2) {
      pos.y = 300 + height;
    }
  },
  query: [Position, Velocity, Dimensions],
});

ecs.system<{ pos: Position; vel: Velocity; dimensions: Dimensions }>({
  update: ({ c: { pos, vel } }) => {
    pos.x += vel.x;
    pos.y += vel.y;
  },
  query: [Position, Velocity, Dimensions],
});

ecs.system({
  update: ({ c: { pos } }) => {
    ctx.drawImage(img, pos.x, pos.y);
  },
  query: [Position],
});

for (let i = 0; i < 20; i++) {
  const block = ecs.entity();
  block.add<Position>(Position, {
    x: Math.random() * 300,
    y: Math.random() * 300,
  });
  block.add<Velocity>(Velocity, {
    x: Math.random() - 0.5,
    y: Math.random() - 0.5,
  });
  block.add<Dimensions>(Dimensions, {
    width: 24,
    height: 32,
  });
}

const drawBackground = (ctx: CanvasRenderingContext2D) => {
  for (let x = 0; x < 19; x++) {
    for (let y = 0; y < 19; y++) {
      ctx.drawImage(bg, x * 16, y * 16);
    }
  }
};

(function loop() {
  drawBackground(ctx);
  ecs.update();

  requestAnimationFrame(loop);
})();
