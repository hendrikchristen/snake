import { GRID, type Game } from "./snake";

// Das LCD sieht in hellem und dunklem Modus gleich aus.
export const LCD = "#b9c49a";
const PIXEL = "#26301b";
const GHOST = "rgba(38, 48, 27, 0.06)";

/** Passt die Canvas-Auflösung an Anzeigegröße und Pixeldichte an. */
function fitCanvas(canvas: HTMLCanvasElement): number {
  const dpr = window.devicePixelRatio || 1;
  const size = Math.round(canvas.clientWidth * dpr);
  if (canvas.width !== size) {
    canvas.width = size;
    canvas.height = size;
  }
  return size;
}

export function draw(canvas: HTMLCanvasElement, game: Game): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const size = fitCanvas(canvas);
  const c = size / GRID;
  const gap = Math.max(1, c * 0.1);

  ctx.fillStyle = LCD;
  ctx.fillRect(0, 0, size, size);

  // Schwach sichtbare "Geisterpixel" wie auf einem echten LCD
  ctx.fillStyle = GHOST;
  for (let y = 0; y < GRID; y++)
    for (let x = 0; x < GRID; x++)
      ctx.fillRect(x * c + gap / 2, y * c + gap / 2, c - gap, c - gap);

  ctx.fillStyle = PIXEL;
  game.snake.forEach((s, i) => {
    const inset = i === 0 ? gap / 2 : gap;
    ctx.fillRect(s.x * c + inset, s.y * c + inset, c - inset * 2, c - inset * 2);
  });

  // Augen am Kopf, in Blickrichtung
  const { dir } = game;
  const h = game.snake[0];
  const e = c * 0.16;
  const cx = h.x * c + c / 2;
  const cy = h.y * c + c / 2;
  const fx = dir.x * c * 0.18;
  const fy = dir.y * c * 0.18;
  const px = -dir.y * c * 0.2;
  const py = dir.x * c * 0.2;
  ctx.fillStyle = LCD;
  ctx.fillRect(cx + fx + px - e / 2, cy + fy + py - e / 2, e, e);
  ctx.fillRect(cx + fx - px - e / 2, cy + fy - py - e / 2, e, e);

  // Futter als kleines Pixel-Kreuz
  if (game.food) {
    ctx.fillStyle = PIXEL;
    const q = c / 3;
    const x0 = game.food.x * c;
    const y0 = game.food.y * c;
    ctx.fillRect(x0 + q, y0 + gap, q, q);
    ctx.fillRect(x0 + gap, y0 + q, q, q);
    ctx.fillRect(x0 + c - q - gap, y0 + q, q, q);
    ctx.fillRect(x0 + q, y0 + c - q - gap, q, q);
  }
}
