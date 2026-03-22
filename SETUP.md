# Bingo Online – Deployment auf Cloudflare Pages

## Tech Stack
- **Next.js 15** (App Router, Edge Runtime)
- **@cloudflare/next-on-pages** – Adapter für Cloudflare Pages
- **Cloudflare KV** – Persistenter Schlüssel-Wert-Speicher

---

## Schritt 1: Cloudflare KV Namespace erstellen

```bash
# Produktions-Namespace
npx wrangler kv namespace create BINGO_KV

# Vorschau-Namespace (für lokales Testen mit wrangler)
npx wrangler kv namespace create BINGO_KV --preview
```

Die Ausgabe gibt je eine `id` aus – beide in `wrangler.toml` eintragen:

```toml
[[kv_namespaces]]
binding = "BINGO_KV"
id = "<production-id>"
preview_id = "<preview-id>"
```

---

## Schritt 2: Auf Cloudflare Pages deployen

### Option A – GitHub-Integration (empfohlen)

1. Repository auf GitHub pushen
2. In [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages** → **Connect to Git**
3. Einstellungen:
   | Feld | Wert |
   |---|---|
   | Framework preset | Next.js |
   | Build command | `npm run build` |
   | Output directory | `.vercel/output/static` |
4. Unter **Settings → Functions → KV namespace bindings** den Namespace `BINGO_KV` hinzufügen

### Option B – Wrangler CLI

```bash
npm run deploy
```

---

## Lokale Entwicklung

### Mit in-memory Speicher (einfachstes Setup)

```bash
npm install
npm run dev         # Daten gehen bei Neustart verloren
```

### Mit echtem Cloudflare KV (via Wrangler)

```bash
npm install
npm run preview     # Baut die App und startet wrangler pages dev
```

---

## Projektstruktur

```
src/
  app/
    page.tsx                   # Startseite (Spiel erstellen/beitreten)
    game/[session]/page.tsx    # Spiellobby
    game/[session]/[player]/   # Persönliches Spielfeld
    admin/[session]/page.tsx   # Spielverwaltung (nur für Ersteller)
    api/sessions/              # REST API (Edge Runtime)
  components/
    BingoBoard.tsx             # 5×5 Spielfeld
    BingoCell.tsx              # Einzelne Zelle
    WinModal.tsx               # Gewinnmeldung
  lib/
    bingo.ts                   # Spiellogik (Mischen, Gewinnprüfung)
    storage.ts                 # KV-Persistenz (Cloudflare KV / in-memory)
    templates.ts               # Vordefinierte Wortlisten
    types.ts                   # TypeScript-Typen
wrangler.toml                  # Cloudflare-Konfiguration (KV, Kompatibilität)
```

---

## Spielablauf

1. **Spiel erstellen** → Vorlage wählen oder eigene Wörter eingeben → Link teilen
2. **Mitspielen** → Name eingeben → persönliches, gemischtes 5×5 Spielfeld
3. **Spielen** → Felder anklicken → BINGO!
4. **Verwalten** → Admin-Seite (nur für Ersteller, Token in localStorage gespeichert)
