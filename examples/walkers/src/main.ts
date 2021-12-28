import "./style.css";
import { createEcs } from "carabora-ecs";
import sprite from "./assets/player.png";

const canvas = document.createElement("canvas");
canvas.height = 300;
canvas.width = 300;
const ctx = canvas.getContext("2d")!;
ctx.imageSmoothingEnabled = false;
document.body.appendChild(canvas);

interface Position {
  x: number;
  y: number;
}

const ecs = createEcs<
  { t: number; o: { x: number } },
  {
    pos: Position;
    sprites: Record<"left" | "right", HTMLCanvasElement | HTMLImageElement>;
    dir: "left" | "right";
    seed: number;
  }
>();
const Position = ecs.component<Position>("pos", { x: 1, y: 1 });
const Sprites = ecs.component("sprites", {});
const Direction = ecs.component("dir", "left");
const Seed = ecs.component("seed", 0);

const img = document.createElement("img");
img.src = sprite;

for (let i = 0; i < 100; i++) {
  const p = ecs.entity();
  p.add(Position, { x: Math.random() * 300, y: Math.random() * 300 - 5 });
  p.add(Sprites);
  p.add(Direction, Math.random() < 0.5 ? "left" : "right");
  p.add(Seed, Math.random() * 100);
}

img.onload = () => {
  ecs.system({
    update: ({ pos, dir, seed }) => {
      const speed = 0.8;
      if (dir === "right") {
        pos.x += speed - seed / 120;
      } else {
        pos.x -= speed - seed / 120;
      }
      if (pos.x > 300) pos.x = -16;
      if (pos.x < -16) pos.x = 300;
    },
    query: [Position, Direction, Seed],
  });
  ecs.system({
    setup: ({ sprites }) => {
      const imageCanvas = document.createElement("canvas");
      imageCanvas.width = img.width;
      imageCanvas.height = img.height;
      const context = imageCanvas.getContext("2d")!;
      context.imageSmoothingEnabled = false;
      context.translate(img.width, 0);
      context.scale(-1, 1);
      context.drawImage(img, 0, 0);
      sprites.left = imageCanvas;
      sprites.right = img;
    },
    update: ({ sprites, pos, dir, seed }, { t }) => {
      const scale = 1;
      const frame = Math.floor(((t + seed) / 5) % 4);

      ctx.drawImage(
        sprites[dir],
        17 + frame * 48,
        68,
        16,
        24,
        pos.x as number,
        pos.y as number,
        16 * scale,
        24 * scale
      );
    },
    query: [Position, Sprites, Seed],
  });

  let t = 0;
  ecs.setup();
  const loop = () => {
    if (ctx) {
      t++;
      ctx.fillStyle = "#151102";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ecs.update({ t, o: { x: 1 } });
      requestAnimationFrame(loop);
    }
  };
  loop();
};
