import { describe, expect, it } from "vitest";
import { DIRS, GRID, START_STEP, STEP_DELTA, createGame, tick, turn, type Game } from "./snake";

function gameWith(partial: Partial<Game>): Game {
  return { ...createGame(() => 0), ...partial };
}

describe("turn", () => {
  it("verwirft eine 180°-Wende", () => {
    const game = createGame();
    turn(game, "left");
    expect(game.queue).toEqual([]);
  });

  it("verwirft eine Wende gegen die zuletzt eingereihte Richtung", () => {
    const game = createGame();
    turn(game, "up");
    turn(game, "down");
    expect(game.queue).toEqual([DIRS.up]);
  });

  it("reiht höchstens zwei Wechsel ein", () => {
    const game = createGame();
    turn(game, "up");
    turn(game, "left");
    turn(game, "down");
    expect(game.queue).toEqual([DIRS.up, DIRS.left]);
  });
});

describe("tick", () => {
  it("bewegt die Schlange ohne sie zu verlängern", () => {
    const game = gameWith({ food: { x: 0, y: 0 } });
    expect(tick(game)).toBe("moved");
    expect(game.snake[0]).toEqual({ x: 10, y: 10 });
    expect(game.snake).toHaveLength(3);
  });

  it("frisst: länger, mehr Punkte, schneller", () => {
    const game = gameWith({ food: { x: 10, y: 10 } });
    expect(tick(game, () => 0)).toBe("ate");
    expect(game.snake).toHaveLength(4);
    expect(game.score).toBe(1);
    expect(game.step).toBe(START_STEP - STEP_DELTA);
    expect(game.snake.some((s) => s.x === game.food!.x && s.y === game.food!.y)).toBe(false);
  });

  it("stirbt an der Wand", () => {
    const game = gameWith({ snake: [{ x: GRID - 1, y: 0 }], food: { x: 0, y: 5 } });
    expect(tick(game)).toBe("died");
  });

  it("stirbt am eigenen Körper", () => {
    // Kopf bei (5,5) läuft nach unten in (5,6), das zum Körper gehört.
    const snake = [
      { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 5, y: 6 }, { x: 4, y: 6 },
    ];
    const game = gameWith({ snake, dir: DIRS.down, food: { x: 0, y: 0 } });
    expect(tick(game)).toBe("died");
  });

  it("darf in das Feld des Schwanzendes laufen, das gerade frei wird", () => {
    const snake = [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 5, y: 6 }];
    const game = gameWith({ snake, dir: DIRS.down, food: { x: 0, y: 0 } });
    expect(tick(game)).toBe("moved");
  });
});
