# Bingo Online – Deployment auf Vercel

## Voraussetzungen

- [Vercel-Account](https://vercel.com)
- [Upstash Redis](https://console.upstash.com) (kostenloser Plan reicht)

## Schritt 1: Upstash Redis erstellen

1. Gehe zu https://console.upstash.com
2. Erstelle eine neue Redis-Datenbank (Region: Frankfurt für niedrige Latenz)
3. Kopiere `UPSTASH_REDIS_REST_URL` und `UPSTASH_REDIS_REST_TOKEN`

> **Alternative:** Füge die [Upstash Redis Integration](https://vercel.com/marketplace?search=upstash) direkt in Vercel Marketplace hinzu – dann werden die Env-Variablen automatisch gesetzt.

## Schritt 2: Auf Vercel deployen

```bash
npx vercel --prod
```

Oder verbinde das GitHub-Repository direkt in der Vercel-Dashboard.

## Schritt 3: Umgebungsvariablen setzen

In den Vercel-Projekteinstellungen unter **Settings → Environment Variables**:

| Variable | Wert |
|---|---|
| `UPSTASH_REDIS_REST_URL` | `https://xxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | `dein-token` |

## Lokale Entwicklung

```bash
# .env.local erstellen
cp .env.example .env.local
# Werte aus Upstash eintragen

npm install
npm run dev
```

Ohne Redis läuft die App mit In-Memory-Speicher (Daten gehen bei Neustart verloren).

## Spielablauf

1. **Spiel erstellen** → Vorlage wählen oder eigene Wörter eingeben → Spiellink teilen
2. **Mitspielen** → Namen eingeben → persönliches gemischtes Spielfeld erhalten
3. **Spielen** → Felder anklicken → Bingo!
4. **Verwalten** → Admin-Link (automatisch gespeichert) → Wörter bearbeiten, Spieler sehen

## Projektstruktur

```
src/
  app/
    page.tsx                   # Startseite (Spiel erstellen/beitreten)
    game/[session]/page.tsx    # Spiellobby
    game/[session]/[player]/   # Persönliches Spielfeld
    admin/[session]/page.tsx   # Spielverwaltung (nur für Ersteller)
    api/sessions/              # REST API
  components/
    BingoBoard.tsx             # 5×5 Spielfeld
    BingoCell.tsx              # Einzelne Zelle
    WinModal.tsx               # Gewinnmeldung
  lib/
    bingo.ts                   # Spiellogik (Mischen, Gewinnprüfung)
    storage.ts                 # Datenpersistenz (Upstash Redis)
    templates.ts               # Vordefinierte Wortlisten
    types.ts                   # TypeScript-Typen
```
