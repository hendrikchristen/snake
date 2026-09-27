# Snake

Klassisches Snake im Look eines alten Handy-Displays, gebaut mit Next.js und TypeScript.

## Steuerung

| | Tastatur | Handy |
|---|---|---|
| Lenken | Pfeiltasten oder W A S D | Wischen auf dem Spielfeld oder Steuerkreuz |
| Pause | Leertaste, P oder Esc | Mitteltaste des Steuerkreuzes |
| Neustart | Enter | „Nochmal“ nach Game Over |

Jedes Futter macht die Schlange länger und etwas schneller. Das Spiel endet an der Wand oder am eigenen Körper. Der Rekord wird im Browser gespeichert.

## Lokal starten

Voraussetzung: [Node.js](https://nodejs.org) 24 oder neuer.

```bash
npm install
npm run dev
```

Danach läuft das Spiel unter http://localhost:3000.

| Befehl | Zweck |
|---|---|
| `npm test` | Tests der Spiellogik |
| `npm run lint` | Code-Prüfung |
| `npm run build` | Produktions-Build |
