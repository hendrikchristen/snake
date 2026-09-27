# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projekt

Snake als Web-App. Übungsprojekt, um den Workflow (Plan → Umsetzung → Commit → Veröffentlichen) für eine spätere sportpsychologische Trainings-App zu lernen. Der Nutzer ist Einsteiger: Schritte kurz auf Deutsch erklären.

- Oberfläche, Kommentare und Commit-Nachrichten auf **Deutsch**.
- GitHub: https://github.com/hendrikchristen/snake (öffentlich, Branch `main`).
- Zusätzlich als Claude-Artifact veröffentlicht: https://claude.ai/artifact/Vfs1j9uerXMxmAjgjTzPXQ — bei Updates `index.html` mit diesem `url` neu veröffentlichen, sonst entsteht ein neues Artifact.

## Ausführen

Kein Build, keine Abhängigkeiten, keine Tests. `index.html` direkt im Browser öffnen.

`gh` ist per winget installiert, liegt aber evtl. nicht im PATH der Bash-Shell: dann `"/c/Program Files/GitHub CLI/gh.exe"` verwenden.

## Architektur

Alles steckt in `index.html` (CSS + JS inline, in einer IIFE). Die Datei ist ohne `<html>/<head>/<body>` geschrieben, weil der Artifact-Publisher dieses Gerüst ergänzt; Browser rendern sie trotzdem korrekt.

- **Zustandsautomat** `state`: `ready | running | paused | over`. Übergänge nur über `start()`, `togglePause()`, `gameOver()`; das Overlay (`showOverlay`) spiegelt den Zustand.
- **Spielschleife**: `requestAnimationFrame` mit Zeit-Akkumulator; `tick()` läuft alle `step` ms. Tempo sinkt pro Futter um `STEP_DELTA` bis `MIN_STEP`.
- **Eingaben** (Tastatur, Wischen auf `.screen`, Steuerkreuz) laufen alle über `turn(name)`. Richtungswechsel landen in einer Queue (max. 2), die 180°-Wenden gegen die *letzte eingereihte* Richtung verwirft.
- **Kollision**: Beim Nicht-Fressen wird das Schwanzende ignoriert, da es im selben Tick weiterrückt.
- **Farben**: Seite/Rahmen über CSS-Tokens mit hellem und dunklem Modus (`:root`, `prefers-color-scheme`, `[data-theme]`). Das LCD-Display ist bewusst in beiden Modi gleich; seine Farben stehen als JS-Konstanten (`LCD`, `PIXEL`, `GHOST`) im Script.
- **Rekord** in `localStorage` unter `snake-best`, Zugriffe immer in try/catch.
