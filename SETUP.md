# MySession — Setup-Anleitung (Neon)

Schritt-für-Schritt, um lokal mit echter Datenbank loszulegen.

## 1. Neon-Projekt anlegen

1. Auf [console.neon.tech](https://console.neon.tech) einloggen.
2. **New Project** klicken:
   - **Name**: `mysession`
   - **Postgres version**: 17 (oder neueste verfügbare)
   - **Region**: `Europe (Frankfurt)` — niedrige Latenz von Luzern aus.
3. Projekt wird in ~10 Sekunden erstellt.

## 2. Connection-Strings holen

Im Neon-Dashboard, Reiter **Dashboard** (Hauptseite des Projekts):

Du siehst eine Box **Connection string**. Darunter ein Toggle:

- **Pooled connection** (default, aktiviert) → **`DATABASE_URL`**
- **Direct connection** (Toggle deaktivieren) → **`DIRECT_URL`**

Beide URLs sehen so ähnlich aus:

```
postgresql://<user>:<password>@ep-xyz-123-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
postgresql://<user>:<password>@ep-xyz-123.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

Der einzige Unterschied: `-pooler` im Hostname.

| Variable | Wofür | Welche URL |
|---|---|---|
| `DATABASE_URL` | Laufende App | URL **mit** `-pooler` |
| `DIRECT_URL` | Prisma Migrations | URL **ohne** `-pooler` |

Tipp: Neon zeigt am Ende der URL automatisch `?sslmode=require` — das bleibt drin, brauchen wir.

## 3. `.env.local` füllen

Öffne `~/Sites/MySession/.env.local` und ersetze die Platzhalter:

```bash
# Pooler-URL für die App (mit -pooler im Hostname)
DATABASE_URL="postgresql://<user>:<password>@ep-xyz-123-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# Direct-URL für Migrations (ohne -pooler)
DIRECT_URL="postgresql://<user>:<password>@ep-xyz-123.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# AUTH_SECRET: unbedingt neu generieren!
AUTH_SECRET="<output-von-openssl-rand-base64-32>"
AUTH_TRUST_HOST="true"
```

`AUTH_SECRET` generierst du im Terminal:

```bash
openssl rand -base64 32
```

## 4. Datenbank-Schema deployen

Vom Projekt-Root:

```bash
cd ~/Sites/MySession
pnpm exec prisma migrate dev --name init
```

Das erstellt alle Tabellen (User, Workshop, Day, Block, Method, Template, LiveSession, …) und legt das `prisma/migrations/`-Verzeichnis an.

## 5. Seed-Daten einspielen

Es gibt zwei Dummy-Auth-User (`admin/admin` und `user/user`). Damit Workshops, Templates etc. mit ihnen verknüpft werden können, müssen sie auch in der DB existieren.

```bash
pnpm exec tsx prisma/seed.ts
```

Das Script ist idempotent — du kannst es jederzeit erneut laufen lassen.

## 6. Dev-Server starten

```bash
pnpm dev
```

→ [http://localhost:3000](http://localhost:3000) (oder Port 3200, je nachdem was frei ist).

Login mit `admin/admin` oder `user/user`.

## Neon-Besonderheiten

- **Auto-Suspend**: Nach ~5 Minuten Inaktivität schläft die Compute-Instanz ein. Erste Query nach Pause = ~500ms Cold-Start. Für Pilot-Nutzung völlig okay.
- **Branching**: In Neon kannst du DB-Branches erstellen (wie Git). Praktisch, wenn du später Migrations auf einer Kopie testen willst.
- **Free-Tier-Limit**: 0.5 GB Storage, 191 compute hours/Monat — reicht für Tausende Workshop-Sessions.

## Troubleshooting

- **`Can't reach database server`** → Tippfehler im Connection-String oder `?sslmode=require` fehlt.
- **`prepared statement … already exists`** → `DATABASE_URL` zeigt nicht auf den Pooler. Hostname muss `-pooler` enthalten.
- **`migration drift`** → DB und Schema sind auseinandergelaufen. Im Pilot kannst du `pnpm exec prisma migrate reset` laufen lassen (löscht alles, baut neu).
- **`AUTH_SECRET missing`** → `.env.local` neu laden: Server stoppen und `pnpm dev` neu starten.
- **`SSL connection required`** → `?sslmode=require` an die URL anhängen.
