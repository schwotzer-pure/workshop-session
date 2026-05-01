# Handoff: Sessions by UNION — Bold Brand Refresh

## Überblick

Brand-Refresh des Workshop-Planungs-Tools (vormals "MySession", neu **"Sessions by UNION"**) in der **Bold-Richtung**: neuer Wordmark + custom Mark (3 gestapelte Timeline-Blöcke in S-Silhouette), sauberes Logo-System, Motion-Spec, Brand-Sheet (Farbe + Typo) und mehrere In-Product-Anwendungen.

## About the Design Files

Die HTML-Dateien in diesem Bundle sind **Design-Referenzen** — Prototypen, die das angestrebte Aussehen und Verhalten zeigen. Sie sind **nicht** dafür gedacht, 1:1 in Production kopiert zu werden.

Aufgabe in Claude Code: Diese Designs im **bestehenden MySession-Codebase** (Next.js 16 App Router · React 19 · Tailwind v4 · shadcn/ui · OKLCH-Variablen in `src/app/globals.css`) umsetzen, mit den dort etablierten Komponenten und Patterns. Das vorhandene Token-System in `globals.css` deckt Neon-Farben (`--neon-cyan`, `--neon-violet`, `--neon-pink`, `--neon-lime`), Aurora-Hintergründe (`.aurora-bg`, `.aurora-bg-strong`), `.neon-text` und `.glass-card` bereits ab — diese Klassen existieren also schon und werden weiterverwendet.

## Fidelity

**High-fidelity.** Farben, Typografie, Spacing und Interaktionen sind final. Pixelgenau übernehmen.

---

## Naming-Migration

| vorher | nachher |
|---|---|
| MySession | **Sessions** (Wordmark) |
| MySession by UNION | **Sessions by UNION** (volle Lockup) |
| Wordmark mit `neon-text`-Gradient | Wordmark in Geist 700, einfarbig — Farbe trägt die Mark, nicht der Text |

Strings, die ersetzt werden müssen (Volltextsuche im Repo nötig):
- `MySession` → `Sessions`
- `mysession-logo.svg` → `sessions-logo.svg` (neuer Asset, siehe unten)
- Sidebar-Brandcell in `src/components/sidebar.tsx`: aktueller Block mit `<span className="neon-text">MySession</span>` wird durch das neue Lockup-Component ersetzt
- Login-Page `src/app/login/page.tsx`: gleiches dort
- Footer-Text "MySession · hellopure · Workshop-Planung neu gedacht" → "Sessions by UNION · hellopure · Workshop-Planung neu gedacht"

---

## Logo-System

### 1) Mark — "Block-Stack S"

Die Mark zeigt drei gestapelte Timeline-Blöcke, die zusammen eine S-Silhouette bilden — Anspielung auf "Sessions" und auf die Block-basierte Workshop-Timeline des Produkts.

**Konstruktion auf 12×12 Raster, Basiseinheit u = 1/12 der Markenhöhe:**

| Block | top | left | right | height |
|---|---|---|---|---|
| b1 (oben)  | 18% | 16% | 36% | 14% (~1.7u) |
| b2 (mitte) | 43% | 24% | 16% | 14% |
| b3 (unten) | 68% | 16% | 36% | 14% |

- Block-Verschub horizontal: ±2u zwischen aufeinanderfolgenden Blöcken
- Block-Border-Radius: 4px (skaliert mit `border-radius: calc(var(--mark-size) * 0.027)` für Konsistenz bei großen Größen)
- Container-Border-Radius: `12px` bei 72×72; `calc(size * 0.166)` für andere Größen

**Container-Hintergrund (primary):**
```css
background: linear-gradient(180deg, oklch(0.22 0.03 280), oklch(0.16 0.02 280));
border: 1px solid oklch(1 0 0 / 0.10);
```

**Block-Füllung (primary, color):**
```css
background: linear-gradient(135deg,
  oklch(0.82 0.16 200),       /* neon-cyan */
  oklch(0.65 0.26 295) 60%,   /* neon-violet */
  oklch(0.72 0.24 350)        /* neon-pink */
);
box-shadow: 0 0 18px oklch(0.65 0.26 295 / 0.45);
```

**Block-Opazität (Hierarchie unten → oben):**
- b1: 1.0
- b2: 0.85
- b3: 0.65

### 2) Wordmark

- Familie: **Geist** (`@import` aus Google Fonts oder lokal)
- Gewicht: **700**
- Letter-spacing: `-0.035em`
- Line-height: `0.9`
- Farbe: `var(--foreground)` — KEIN Gradient mehr

### 3) Lockup "Sessions by UNION"

Horizontal:
```
[Mark (size × 1.1)]  [Sessions]
                     [by ⟨UNION⟩]
```
- Gap zwischen Mark und Wordmark-Block: `16px`
- "by" + UNION-Logo: `var(--muted-foreground)`, font-weight 500, `font-size: lockupSize * 0.2`, gap `8px`, UNION-Logo `height: lockupSize * 0.2`

Vertikal: Mark oben, Lockup darunter, gap `14px`.

### 4) Clearspace

**Mind. 1u rundum frei.** 1u = 1/12 der Markenhöhe (= halbe Block-Höhe). Andere Marken, Text oder Bildkanten dürfen nicht in diese Zone.

### 5) Mindestgrößen

| Größe | Verwendung |
|---|---|
| **16 px** | Favicon — nur Mark, keine Wordmark |
| **24 px** | App-Sidebar minimal — Mark + Wordmark in 17 px |
| **48 px** | Standard Header — volle Lockup |
| **96 px+** | Marketing-Hero |

Unter 16 px: Mark nicht verwenden — auf Buchstabe "S" in Geist 900, Letter-spacing `-0.06em`, mit Neon-Gradient ausweichen (Favicon-Cut).

### 6) Mark-Varianten (4 zugelassen)

1. **Color** — Default, oben spezifiziert, dunkler Container
2. **Mono auf dunkel** — Container `oklch(0.18 0.02 280)`, Blöcke `oklch(0.99 0.005 280)` (weiß)
3. **Mono auf hell** — Container `oklch(0.99 0.005 280)`, Blöcke `oklch(0.18 0.01 260)`
4. **Outline** — Container und Blöcke nur 1.5px Border, Farbe `oklch(0.99 0.005 280 / 0.9)`. Nur über Bildern.

---

## Motion-Spec

### Reveal (beim Mount)

- **Dauer**: 2.4s
- **Easing**: `cubic-bezier(.22,.61,.36,1)`
- **Iteration**: einmalig beim Mount; in Live-Cockpit-Sidebar einmal pro Session-Wechsel

**Keyframes pro Block:**

| Block | Property | 0% | 30% | 60% | 100% |
|---|---|---|---|---|---|
| b1 | translateX | -30% | -8% | -2% | 0 |
| b1 | opacity   | 0 | 1 | 1 | 1 |
| b2 | translateX | +30% | +18% | +4% | 0 |
| b2 | opacity   | 0 | 0 | 1 | 1 |
| b3 | translateX | -30% | -22% | -10% | 0 |
| b3 | opacity   | 0 | 0 | 0.5 | 1 |

**Delays:** b1 = 0s, b2 = 0.15s, b3 = 0.30s.

### Live-Pulse (während aktiver Session in Cockpit/Beamer)

Nur b2 pulsiert:
```css
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 18px oklch(0.65 0.26 295 / 0.45); }
  50%      { box-shadow: 0 0 36px oklch(0.65 0.26 295 / 0.85); }
}
.mark.live .blk.b2 { animation: pulse 2.6s ease-in-out infinite; }
```

`prefers-reduced-motion`: Reveal überspringen, Pulse deaktivieren — Mark direkt in Endzustand rendern.

---

## Design-Tokens

Alle bereits in `src/app/globals.css` vorhanden — keine Änderung nötig. Nur Bestätigung der Werte:

```css
--neon-cyan:   oklch(0.82 0.16 200);
--neon-pink:   oklch(0.72 0.24 350);
--neon-violet: oklch(0.65 0.26 295);
--neon-lime:   oklch(0.88 0.22 145);   /* Live-Status, "danke!" */

/* Brand background stack (dark) */
oklch(0.10 0.02 280)  /* Ink — Vollbild Beamer-Hintergrund */
oklch(0.14 0.02 280)  /* Base — --background dark */
oklch(0.18 0.02 280)  /* Surface — Cards, Sidebars */
oklch(0.22 0.03 280)  /* Surface-elevated — Mark-Container top */

/* Light */
oklch(0.99 0.005 280) /* Paper */
oklch(0.18 0.01 260)  /* Foreground on light */
```

### Typografie

| Rolle | Familie | Größe / Line-height | Weight | Letter-spacing |
|---|---|---|---|---|
| Display | Geist | 56/64 | 700 | -0.025em |
| H1 | Geist | 28/32 | 600 | -0.018em |
| Title-md | Geist | 22/26 | 600 | -0.012em |
| Body | Geist | 14/22 | 400 | 0 |
| Eyebrow | JetBrains Mono | 11/14 | 500 | 0.14em, uppercase |
| Mono | JetBrains Mono | 11–13 | 400-500 | 0.04em |
| Beam-now (Beamer aktueller Block) | Geist | 64/64 | 700 | -0.02em |
| Beam-timer (Beamer Countdown) | JetBrains Mono | 96/96 | 700 | -0.02em |

Beide Fonts via Google Fonts: `Geist:wght@300..900` und `JetBrains+Mono:wght@400..600`.

### Border-Radius (existing scale, unverändert)

`--radius: 0.75rem`. Karten 14px, Pills 999px, Buttons 10px, Inputs 10px.

---

## In-Product-Anwendungen

### A) Sidebar (`src/components/sidebar.tsx`)

Brandcell aktuell:
```tsx
<span className="neon-text text-lg font-semibold tracking-tight">MySession</span>
<span className="mt-1 flex items-center gap-1.5 text-[10px] ...">by <UnionLogo /></span>
```

→ Neu: kompakte horizontale Lockup-Variante, Mark links neben Wordmark.
- Mark-Größe: **26 px** quadratisch
- Wordmark "Sessions": Geist 700, **18 px**, Letter-spacing -0.035em, line-height 0.9, Farbe `var(--foreground)` — kein Gradient
- "by ⟨UNION⟩" in **9 px** unter dem Wordmark, gap 6px, UNION-Logo Höhe 8 px
- Gap Mark ↔ Wordmark-Block: 10 px

Aktiver Nav-Item bleibt wie bisher (Neon-Gradient-Background mit inner ring).

### B) Login (`src/app/login/page.tsx`)

- Großes Lockup zentriert über der Glass-Card statt aktuellem `MySession`-Wordmark
- Lockup-Größe: 36 px
- Footer-Text: `Sessions by UNION · hellopure · Workshop-Planung neu gedacht`
- Header der Card: "Willkommen zurück" → unverändert
- Subhead: "Melde dich an, um deine Workshops zu planen." → unverändert
- Submit-Button: voller Neon-Gradient (`linear-gradient(120deg, var(--neon-cyan), var(--neon-violet) 50%, var(--neon-pink))`), Text in `oklch(0.14 0.02 280)`

### C) Workshop-Editor — Block-Timeline (`src/components/editor/workshop-editor.tsx`)

Header:
- Eyebrow: `Workshop · Tag X von Y`
- H1: Workshop-Name in Geist 600, 20 px, -0.018em
- Tag rechts: `Live · Tag 1` mit Lime-Dot wenn aktive Session läuft

Block-Row Struktur:
```
[ Accent-Bar 4×36 | Time mono 11px | Duration-Pill 11px | Label + Type-eyebrow | optional Live-Tag ]
```
- Grid: `64px 80px 1fr auto`, gap 12px
- Padding: 10px 12px
- Border-Radius: 10px
- Background: `var(--bg-2)` = surface
- Border: 1px solid `var(--line)` (`oklch(1 0 0 / 0.10)`)

**Aktiver (live) Block:**
- Background: `linear-gradient(90deg, oklch(0.65 0.26 295 / 0.12), oklch(0.16 0.02 280) 40%)`
- Border-Color: `oklch(0.65 0.26 295 / 0.45)`
- Live-Tag rechts: Lime-Pill mit Dot + `läuft · MM:SS`

Accent-Bar-Farben pro Block-Typ:
| Typ | Farbe |
|---|---|
| Energizer | `var(--neon-cyan)` |
| Übung / Reflexion | `var(--neon-violet)` |
| Diskussion | `var(--neon-pink)` |
| Pause | `oklch(0.5 0.02 280)` |
| Breakout | `var(--neon-violet)` |

### D) Method Library (`src/components/library/method-library.tsx`)

Header:
- Eyebrow: `Methodik`
- H1: `Methoden-Bibliothek` (Geist 600 · 24 px · -0.02em)
- Subhead: `42 Methoden · 6 Kategorien · von UNION + Community.`

Filter-Pills rechts: `Alle / Reflexion / Übung / Energizer …`. Aktiver Pill:
```css
background: oklch(0.65 0.26 295 / 0.18);
border-color: oklch(0.65 0.26 295 / 0.5);
color: var(--foreground);
```

Method-Card:
- Padding 16px, Border-Radius 14px, Border 1px solid `var(--line)`, Background `oklch(0.16 0.02 280)`, Höhe 150px
- Decorative Swirl: absoluter blurred Gradient (`filter: blur(28px)`, opacity 0.6), Position `inset: -40% -20% 40% 60%`. Per-Card unterschiedlicher Gradient (siehe unten)
- Layout: Tag oben, Titel + Mono-Meta unten

Card-Gradients per Kategorie:
- Reflexion: `linear-gradient(135deg, var(--neon-cyan), var(--neon-violet))`
- Synthese: `linear-gradient(135deg, var(--neon-violet), var(--neon-pink))`
- Übung: `linear-gradient(135deg, var(--neon-pink), oklch(0.6 0.18 30))`
- Energizer: `linear-gradient(135deg, var(--neon-lime), var(--neon-cyan))`
- Diskussion: `linear-gradient(135deg, var(--neon-cyan), var(--neon-pink))`

### E) App-Icons (`src/app/icon.tsx`, `src/app/apple-icon.tsx`)

Beide aktualisieren:
- iOS Primary (180×180): Container Gradient `linear-gradient(180deg, oklch(0.22 0.03 280), oklch(0.10 0.02 280))`, Mark zentriert auf 56% der Fläche
- macOS Light: Paper-Hintergrund, Mono-Light Mark
- Tinted: Container `linear-gradient(135deg, oklch(0.55 0.22 295), oklch(0.4 0.22 295))`, Mark in Mono-Dark
- Notification 32×32 + Favicon 16×16: `oklch(0.10 0.02 280)`-Hintergrund, Mark Color-Variante

Border-Radius iOS: `22 px` bei 96 px, also `22.9%`.

---

## Komponenten zum Anlegen

Neuer Ordner `src/components/brand/`:

- **`brand/sessions-mark.tsx`** — die Mark allein. Props: `size: number`, `variant: 'color' | 'mono-dark' | 'mono-light' | 'outline' | 'tinted'`, `live?: boolean` (aktiviert Pulse), `animate?: boolean` (aktiviert Reveal). Grundlegend ein `<span>` mit drei `<span>`-Blöcken nach obiger Spec.
- **`brand/sessions-wordmark.tsx`** — nur das Wort "Sessions" in Geist 700.
- **`brand/sessions-lockup.tsx`** — Mark + Wordmark + "by ⟨UNION⟩". Props: `size: number` (Wordmark-Höhe), `orientation: 'horizontal' | 'vertical'`. Importiert `UnionLogo` aus dem bereits existierenden `src/components/union-logo.tsx`.

`UnionLogo` ist unverändert übernehmbar. Es bleibt das offizielle UNION-Wordmark.

### Asset-Update

`public/mysession-logo.svg` darf entfernt werden, sobald keine SSR-/OG-Pfade mehr darauf zeigen. Ersatz: ein neuer `public/sessions-logo.svg` mit der vollen Lockup als statisches SVG (für `<img>`-Verwendungen, OG-Bilder, E-Mail-Vorlagen).

---

## Akzeptanzkriterien

- [ ] Sidebar zeigt "Sessions" in Geist 700, einfarbig, statt Neon-Gradient
- [ ] Mark ist überall die neue Block-Stack-S, in vier Varianten verfügbar
- [ ] Reveal-Motion läuft beim ersten Mount, respektiert `prefers-reduced-motion`
- [ ] Live-Pulse läuft im Cockpit + Beamer während aktiver Session
- [ ] Login-Footer und Page-Title sagen "Sessions by UNION", nicht "MySession"
- [ ] Workshop-Editor zeigt Block-Timeline mit Accent-Bars + Live-Highlight wie spezifiziert
- [ ] Method Library Cards haben Per-Kategorie-Gradient-Swirls
- [ ] App-Icons regeneriert (Favicon + iOS + macOS)
- [ ] Keine `MySession`-Strings mehr im UI; OG-Image und SEO-Metadata aktualisiert

---

## Files in diesem Bundle

- `Sessions by UNION — Bold Brand Sheet.html` — vollständige Spec-Seite (Construction, Motion, Brand-Sheet, In-Product, App-Icons)
- `Sessions by UNION — Brand Refresh.html` — frühere 3-Richtungen-Exploration (Safe / Bold / Wild) zum Kontext
- `brand-pieces.jsx` — wiederverwendbare React-Snippets für Mark, Wordmark, Lockup und Application-Mocks
- `bold-sheet.jsx` — Aufbau der Bold-Spec-Seite
- `brand-canvas.jsx` — Aufbau der 3-Richtungen-Exploration
- `design-canvas.jsx` — Pan/zoom Canvas-Container

Die `.jsx`-Dateien sind über `<script type="text/babel">` geladene Browser-React-Files — sie sind Vorlage für den Mark/Lockup-Code, kein Copy-Paste-Modul. Im Codebase als saubere `tsx`-Komponenten in `src/components/brand/` neu schreiben.
