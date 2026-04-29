# MySession

Workshop-Planungs-Tool für hellopure-Trainer.
Inspiriert von SessionLab — mit zusätzlichem **Live-Run-Mode** (Trainer-Cockpit + Beamer-Display).

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind v4 + shadcn/ui
- **Prisma 7** mit `@prisma/adapter-pg`
- **Neon Postgres** (free tier)
- **NextAuth v5** (Credentials, hardcoded dummy users)
- **dnd-kit** für Drag & Drop
- **Realtime via 1s-Polling** für den Live-Modus

## Lokales Setup

```bash
pnpm install
cp .env.example .env.local
# .env.local mit deinen Neon-Connection-Strings befüllen, AUTH_SECRET generieren
pnpm exec prisma db push          # Schema in die DB
pnpm exec tsx prisma/seed.ts      # Seed: Orgs, Users, Categories, Methods
pnpm dev                          # läuft auf http://localhost:3000
```

## Login (Pilot)

| Username | Passwort | Rolle | Org |
|---|---|---|---|
| `admin` | `admin` | ADMIN | Neustadt |
| `user` | `user` | TRAINER | Pure |

## Datenbank-Schema-Workflow

Wir nutzen `prisma db push` (kein Migrations-Workflow für den Pilot).
Schema-Änderungen:

```bash
# 1. prisma/schema.prisma editieren
# 2. lokal anwenden:
pnpm exec prisma db push
# 3. Prisma Client regenerieren:
pnpm exec prisma generate
# 4. Bei BlockType / enum-Änderungen ggf. force-reset:
PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="ja" pnpm exec prisma db push --force-reset --accept-data-loss
pnpm exec tsx prisma/seed.ts
```

Bei production-DB Änderungen: gleiche Commands gegen die Prod-`DATABASE_URL`.

## Deployment auf Vercel

1. Repo auf GitHub
2. In Vercel: New Project → GitHub-Repo importieren
3. Environment Variables setzen:
   - `DATABASE_URL` (Neon Pooler, mit `-pooler` im Hostname)
   - `DIRECT_URL` (Neon Direct, ohne `-pooler`)
   - `AUTH_SECRET` (`openssl rand -base64 32`)
   - `AUTH_TRUST_HOST=true`
4. Build-Befehl ist bereits `prisma generate && next build` (via package.json scripts)

## Architektur-Notizen

- **Block.type** = strukturell (`BLOCK | GROUP | BREAKOUT | NOTE`)
- **Block.categoryId** = inhaltlich (Exercise, Theory, Discussion, Break, Energizer + custom)
- **NOTE-Blöcke** zählen 0 Minuten zur Timeline
- **GROUP**-Dauer = Σ Children, **BREAKOUT**-Dauer = max(Track-Summen)
- **Locked Block** springt auf seine fixe Zeit, alles davor verschiebt sich nicht
- **Live-Modus** pollt `/api/live/[id]/state` jede Sekunde
- **Versions** = vollständige JSON-Snapshots, restore mit auto-Sicherheits-Snapshot
- **Multi-Tenancy**: `Organization` Hierarchie (UNION → Schwestern), Filter im Dashboard

## Code-Konventionen

- `<body>` hat `suppressHydrationWarning` (ClickUp-Extension injiziert Attribute)
- Sonner-`<Toaster>` muss INSIDE `<body>` sein
- `DropdownMenuLabel` muss in `<DropdownMenuGroup>` (base-ui)
- `"use server"`-Dateien dürfen nur async functions exportieren — Konstanten in `lib/`
- Nach Schema-Änderungen: dev server killen + `.next/` löschen, sonst Caching-Issues mit Prisma client
- `redirect()` aus Server Actions wird via `lib/is-redirect.ts` erkannt um falsche Toast-Errors zu verhindern
