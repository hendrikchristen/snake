// Reine Spiellogik ohne DOM – dadurch testbar und unabhängig von React.

export const GRID = 20;
export const START_STEP = 150; // ms pro Schritt zu Beginn
export const MIN_STEP = 65; // schnellstes Tempo
export const STEP_DELTA = 4; // Beschleunigung pro Futter
const MAX_QUEUE = 2;

export type Point = { x: number; y: number };
export type DirName = "up" | "down" | "left" | "right";
export type Status = "ready" | "running" | "paused" | "over";

export const DIRS: Record<DirName, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export type Game = {
  snake: Point[]; // snake[0] ist der Kopf
  dir: Point;
  queue: Point[]; // eingereihte Richtungswechsel
  food: Point | null; // null = Feld voll, Spiel gewonnen
  score: number;
  step: number;
};

export type TickResult = "moved" | "ate" | "died" | "won";

export function createGame(random: () => number = Math.random): Game {
  const game: Game = {
    snake: [
      { x: 9, y: 10 },
      { x: 8, y: 10 },
      { x: 7, y: 10 },
    ],
    dir: DIRS.right,
    queue: [],
    food: null,
    score: 0,
    step: START_STEP,
  };
  game.food = placeFood(game.snake, random);
  return game;
}

export function placeFood(snake: Point[], random: () => number = Math.random): Point | null {
  const free: Point[] = [];
  for (let y = 0; y < GRID; y++)
    for (let x = 0; x < GRID; x++)
      if (!snake.some((s) => s.x === x && s.y === y)) free.push({ x, y });
  return free.length ? free[Math.floor(random() * free.length)] : null;
}

/** Reiht einen Richtungswechsel ein. 180°-Wenden und Wiederholungen werden verworfen. */
export function turn(game: Game, name: DirName): void {
  const d = DIRS[name];
  const ref = game.queue.length ? game.queue[game.queue.length - 1] : game.dir;
  if (d === ref || (d.x === -ref.x && d.y === -ref.y)) return;
  if (game.queue.length < MAX_QUEUE) game.queue.push(d);
}

/** Bewegt die Schlange um ein Feld. */
export function tick(game: Game, random: () => number = Math.random): TickResult {
  const next = game.queue.shift();
  if (next) game.dir = next;
  const head = { x: game.snake[0].x + game.dir.x, y: game.snake[0].y + game.dir.y };
  const eating = game.food !== null && head.x === game.food.x && head.y === game.food.y;
  // Ohne Fressen rückt das Schwanzende im selben Schritt weiter, sein Feld ist also frei.
  const body = eating ? game.snake : game.snake.slice(0, -1);
  if (
    head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID ||
    body.some((s) => s.x === head.x && s.y === head.y)
  ) {
    return "died";
  }
  game.snake.unshift(head);
  if (!eating) {
    game.snake.pop();
    return "moved";
  }
  game.score++;
  game.step = Math.max(MIN_STEP, game.step - STEP_DELTA);
  game.food = placeFood(game.snake, random);
  return game.food ? "ate" : "won";
}
