# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Projekt

Snake als Next.js-Web-App. Übungsprojekt, um den Workflow (Plan → Branch → Umsetzung → Pull Request → Deployment) für eine spätere sportpsychologische Trainings-App zu lernen. Der Nutzer ist Einsteiger: Schritte kurz auf Deutsch erklären.

- Oberfläche, Kommentare und Commit-Nachrichten auf **Deutsch**.
- GitHub: https://github.com/hendrikchristen/snake. Neue Arbeit auf einem eigenen Branch, dann Pull Request nach `main`.
- Hosting: Vercel. `main` ist live unter https://snake-mauve-delta.vercel.app, jeder Pull Request bekommt eine eigene Vorschau (nur mit Vercel-Login sichtbar). Framework ist in `vercel.json` festgelegt, weil das Projekt ursprünglich als statische Seite importiert wurde.
- GitHub Pages ist abgeschaltet.
- Das Artifact https://claude.ai/artifact/Vfs1j9uerXMxmAjgjTzPXQ ist die alte Einzeldatei-Version und wird nicht mehr aktualisiert.

## Befehle

Node.js 24 liegt unter `C:\Program Files\nodejs`. Falls `npm` in der Bash nicht gefunden wird: `export PATH="/c/Program Files/nodejs:$PATH"`. `gh` ggf. als `"/c/Program Files/GitHub CLI/gh.exe"` aufrufen.

```bash
npm run dev      # Entwicklungsserver auf http://localhost:3000
npm run build    # Produktions-Build (prüft auch TypeScript)
npm run lint     # ESLint inkl. React-Hooks-Regeln
npm test         # Vitest, einmaliger Lauf
npx vitest run -t "stirbt an der Wand"   # einzelner Test
```

`npx tsc --noEmit` meldet `LayoutProps` als unbekannt, solange noch kein Build/Dev-Lauf die Routentypen erzeugt hat; `npm run build` ist die maßgebliche Typprüfung.

## Architektur

Logik, Zeichnen und Oberfläche sind getrennt:

- `src/lib/snake.ts`: reine Spiellogik ohne DOM (`createGame`, `turn`, `tick`, `placeFood`). `tick` gibt `moved | ate | died | won` zurück. Richtungswechsel landen in einer Queue (max. 2), 180°-Wenden gegen die *letzte eingereihte* Richtung werden verworfen. Bei der Kollision wird das Schwanzende ignoriert, wenn nicht gefressen wird, weil es im selben Schritt weiterrückt. Zufall ist injizierbar (`random`-Parameter) für Tests in `snake.test.ts`.
- `src/lib/draw.ts`: Canvas-Zeichnen inkl. Anpassung an die Pixeldichte. Die LCD-Farben sind hier fest und in beiden Farbmodi gleich.
- `src/components/SnakeGame.tsx` (Client-Komponente): Das Spielobjekt und der Zustand für die Schleife liegen in Refs (`gameRef`, `statusRef`), weil sie sich 60× pro Sekunde ändern. Nur HUD-Werte und der Status für das Overlay liegen im React-State. Die Schleife ist ein `requestAnimationFrame` mit Zeit-Akkumulator (`accRef`). Der Rekord wird über `useSyncExternalStore` aus `localStorage` (`snake-best`) gelesen. Das vermeidet Hydration-Abweichungen und `setState` im Effect. Die Lint-Regel `react-hooks/refs` verbietet Funktionen, die während des Renderns Refs lesen. Handler deshalb als Props übergeben (siehe `PadButton`), nicht beim Rendern aufrufen.
- `src/app/layout.tsx` lädt die Schriften über `next/font/google` als CSS-Variablen `--font-*`. `src/app/globals.css` bildet daraus `--display/--digits/--body` und definiert die Farb-Tokens für hell und dunkel. Komponenten-Styles liegen in `SnakeGame.module.css`.
