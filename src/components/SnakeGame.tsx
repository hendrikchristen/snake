"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode, TouchEvent } from "react";
import { draw } from "@/lib/draw";
import { createGame, tick, turn, type DirName, type Game, type Status } from "@/lib/snake";
import styles from "./SnakeGame.module.css";

const KEYMAP: Record<string, DirName> = {
  ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
  w: "up", s: "down", a: "left", d: "right",
  W: "up", S: "down", A: "left", D: "right",
};
const SWIPE_MIN = 24; // px

// Rekord in localStorage; fällt auf den Speicher im Tab zurück, wenn localStorage gesperrt ist.
const BEST_KEY = "snake-best";
let memoryBest = 0;
const bestListeners = new Set<() => void>();

function readBest(): number {
  let stored = 0;
  try {
    stored = parseInt(localStorage.getItem(BEST_KEY) ?? "", 10) || 0;
  } catch {}
  return Math.max(stored, memoryBest);
}

function saveBest(value: number): void {
  memoryBest = value;
  try {
    localStorage.setItem(BEST_KEY, String(value));
  } catch {}
  bestListeners.forEach((l) => l());
}

function subscribeBest(listener: () => void): () => void {
  bestListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    bestListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

type Outcome = { won: boolean; record: boolean };

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Das Spielobjekt ändert sich bei jedem Schritt und liegt deshalb in einer Ref, nicht im State.
  const gameRef = useRef<Game | null>(null);
  const statusRef = useRef<Status>("ready");
  const accRef = useRef(0);
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const [status, setStatus] = useState<Status>("ready");
  const [score, setScore] = useState(0);
  const [length, setLength] = useState(3);
  const [outcome, setOutcome] = useState<Outcome>({ won: false, record: false });
  const best = useSyncExternalStore(subscribeBest, readBest, () => 0);

  const changeStatus = useCallback((next: Status) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const syncHud = useCallback((game: Game) => {
    setScore(game.score);
    setLength(game.snake.length);
  }, []);

  const start = useCallback(() => {
    if (statusRef.current === "over") {
      gameRef.current = createGame();
      syncHud(gameRef.current);
    }
    accRef.current = 0;
    changeStatus("running");
  }, [changeStatus, syncHud]);

  const restart = useCallback(() => {
    statusRef.current = "over";
    start();
  }, [start]);

  const togglePause = useCallback(() => {
    if (statusRef.current === "running") changeStatus("paused");
    else if (statusRef.current === "paused") start();
  }, [changeStatus, start]);

  const primaryAction = useCallback(() => {
    if (statusRef.current === "running" || statusRef.current === "paused") togglePause();
    else start();
  }, [start, togglePause]);

  const steer = useCallback(
    (name: DirName) => {
      if (statusRef.current === "paused") return;
      if (statusRef.current !== "running") start();
      if (gameRef.current) turn(gameRef.current, name);
    },
    [start],
  );

  const advance = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;
    const result = tick(game);
    syncHud(game);
    if (result === "died" || result === "won") {
      const record = game.score > readBest();
      if (record) saveBest(game.score);
      setOutcome({ won: result === "won", record });
      changeStatus("over");
    }
  }, [changeStatus, syncHud]);

  // Spielschleife: feste Schrittweite über einen Zeit-Akkumulator, gezeichnet wird jeden Frame.
  useEffect(() => {
    gameRef.current = createGame();
    let raf = 0;
    let last = performance.now();
    const frame = (t: number) => {
      const game = gameRef.current;
      if (game && statusRef.current === "running") {
        accRef.current += Math.min(t - last, 250);
        while (accRef.current >= game.step && statusRef.current === "running") {
          accRef.current -= game.step;
          advance();
        }
      }
      last = t;
      if (canvasRef.current && gameRef.current) draw(canvasRef.current, gameRef.current);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [advance]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (KEYMAP[e.key]) {
        e.preventDefault();
        steer(KEYMAP[e.key]);
      } else if (e.key === " ") {
        e.preventDefault();
        primaryAction();
      } else if (e.key === "Enter") {
        e.preventDefault();
        restart();
      } else if (e.key === "Escape" || e.key === "p" || e.key === "P") {
        togglePause();
      }
    };
    const onVisibility = () => {
      if (document.hidden && statusRef.current === "running") togglePause();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [steer, primaryAction, restart, togglePause]);

  const onTouchStart = (e: TouchEvent) => {
    const p = e.changedTouches[0];
    touchRef.current = { x: p.clientX, y: p.clientY };
  };

  const onTouchEnd = (e: TouchEvent) => {
    const from = touchRef.current;
    touchRef.current = null;
    if (!from) return;
    const p = e.changedTouches[0];
    const dx = p.clientX - from.x;
    const dy = p.clientY - from.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MIN) return;
    e.preventDefault(); // verhindert den Klick aufs Overlay nach einem Wischen
    if (Math.abs(dx) > Math.abs(dy)) steer(dx > 0 ? "right" : "left");
    else steer(dy > 0 ? "down" : "up");
  };

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <h1 className={styles.title}>Snake</h1>
        <div className={styles.hud}>
          <Stat label="Punkte" value={score} />
          <Stat label="Länge" value={length} />
          <Stat label="Rekord" value={best} />
        </div>
      </header>

      <div className={styles.device}>
        <div className={styles.screen} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <canvas ref={canvasRef} className={styles.canvas} aria-label="Spielfeld" />
          {status !== "running" && (
            <div className={styles.overlay} onClick={primaryAction}>
              <Overlay status={status} score={score} best={best} outcome={outcome} onRestart={start} />
            </div>
          )}
        </div>
        <div className={styles.brand}>
          <span>20 × 20</span>
          <span>Mono LCD</span>
        </div>
      </div>

      <div className={styles.pad} aria-label="Steuerkreuz">
        <PadButton className={styles.up} label="Hoch" onPress={() => steer("up")}>▲</PadButton>
        <PadButton className={styles.left} label="Links" onPress={() => steer("left")}>◀</PadButton>
        <PadButton className={styles.mid} label="Pause" onPress={primaryAction}>II</PadButton>
        <PadButton className={styles.right} label="Rechts" onPress={() => steer("right")}>▶</PadButton>
        <PadButton className={styles.down} label="Runter" onPress={() => steer("down")}>▼</PadButton>
      </div>

      <p className={styles.keys}>
        <kbd>←</kbd> <kbd>↑</kbd> <kbd>→</kbd> <kbd>↓</kbd> oder <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> lenken ·{" "}
        <kbd>Leertaste</kbd> Pause · <kbd>Enter</kbd> Neustart
      </p>
    </div>
  );
}

// Reagiert schon beim Drücken (nicht erst beim Loslassen), damit die Steuerung direkt ist.
function PadButton({
  className,
  label,
  onPress,
  children,
}: {
  className: string;
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <button
      className={className}
      type="button"
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        onPress();
      }}
    >
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.stat}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function Overlay({
  status,
  score,
  best,
  outcome,
  onRestart,
}: {
  status: Status;
  score: number;
  best: number;
  outcome: Outcome;
  onRestart: () => void;
}) {
  if (status === "paused") {
    return (
      <>
        <h2>Pause</h2>
        <p>Leertaste oder tippen zum Weiterspielen</p>
      </>
    );
  }
  if (status === "over") {
    return (
      <>
        <h2>{outcome.won ? "Gewonnen!" : "Game Over"}</h2>
        <div className={styles.big}>{score} Punkte</div>
        <p>{outcome.record ? "Neuer Rekord!" : `Rekord: ${best}`}</p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRestart();
          }}
        >
          Nochmal
        </button>
      </>
    );
  }
  return (
    <>
      <h2>Snake</h2>
      <p>Pfeiltaste drücken oder tippen zum Starten</p>
    </>
  );
}
