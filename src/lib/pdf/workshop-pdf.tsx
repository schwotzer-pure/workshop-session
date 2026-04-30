import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Svg,
  Path,
} from "@react-pdf/renderer";
import { recalcBlocks, sumChildDurations, totalDuration } from "@/lib/recalc";
import { formatDuration } from "@/lib/time";
import { detectLinkKind, safeHost } from "@/lib/link-icon";
import { oklchToHex, withAlpha } from "./color-utils";
import type { WorkshopWithBlocks } from "@/lib/queries";

type Block = WorkshopWithBlocks["days"][number]["blocks"][number];

type WorkshopLink = {
  id: string;
  name: string;
  url: string;
  notes: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Entwurf",
  SCHEDULED: "Geplant",
  RUNNING: "Läuft",
  COMPLETED: "Abgeschlossen",
  ARCHIVED: "Archiviert",
};

const BLOCK_TYPE_LABEL: Record<string, string> = {
  BLOCK: "Block",
  GROUP: "Gruppe",
  BREAKOUT: "Breakout",
  NOTE: "Notiz",
};

// Aurora pastel palette — soft, modern, gendered toward violet/pink
const C = {
  // Surface
  ink: "#1c1a32",
  inkSoft: "#3a385b",
  muted: "#7a7896",
  mutedSoft: "#a8a6c2",
  rule: "#ece6f7",
  ruleSoft: "#f7f4fc",
  paperSoft: "#fbfaff",

  // Aurora pastels (backgrounds)
  pastelCyan: "#dff5fa",
  pastelViolet: "#ece2ff",
  pastelPink: "#fde2ed",
  pastelMint: "#dff5e8",

  // Aurora accents (borders, text emphasis, dots)
  accentCyan: "#3fb8d4",
  accentViolet: "#7c3aed",
  accentPink: "#d946a4",
  accentMint: "#10b981",

  // Trainer / status helpers
  noteBg: "#fff5d6",
  noteAccent: "#a06a05",
  trainerBg: "#f3ebff",
  trainerAccent: "#6d28d9",

  // Pill backgrounds
  pillRunning: "#fde2ed",
  pillRunningText: "#9d174d",
  pillScheduled: "#dff5fa",
  pillScheduledText: "#0e7490",
  pillNeutral: "#f4f1fc",
  pillNeutralText: "#5b5878",
};

const styles = StyleSheet.create({
  // ───────── Page base ─────────
  page: {
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 50,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.ink,
    backgroundColor: "#ffffff",
  },
  pageSummary: {
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 50,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.ink,
    backgroundColor: C.paperSoft,
  },
  // Decorative auroras (faint blobs in corners)
  auroraTopRight: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 240,
    backgroundColor: C.pastelPink,
    opacity: 0.5,
  },
  auroraBottomLeft: {
    position: "absolute",
    bottom: -100,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 280,
    backgroundColor: C.pastelCyan,
    opacity: 0.4,
  },
  auroraMidViolet: {
    position: "absolute",
    top: 320,
    left: 100,
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: C.pastelViolet,
    opacity: 0.4,
  },

  // ───────── Brand bar (top of every page) ─────────
  brandBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  brandLeft: {
    flexDirection: "column",
  },
  brandTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.5,
    color: C.accentViolet,
  },
  brandTitleSmall: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.3,
    color: C.accentViolet,
  },
  brandBy: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  brandByText: {
    fontSize: 7,
    letterSpacing: 1.4,
    color: C.muted,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  brandBySmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  brandByTextSmall: {
    fontSize: 6,
    letterSpacing: 1.2,
    color: C.muted,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },

  // ───────── Hero (top of summary page) ─────────
  eyebrow: {
    fontSize: 8,
    letterSpacing: 3,
    color: C.muted,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 14,
  },
  goalHeroEmpty: {
    marginTop: 22,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: C.ruleSoft,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: C.mutedSoft,
    borderStyle: "dashed",
  },
  goalHeroEmptyText: {
    fontSize: 10.5,
    color: C.muted,
    fontStyle: "italic",
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 18,
  },
  pill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    fontSize: 7.5,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  title: {
    fontSize: 32,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.8,
    lineHeight: 1.1,
  },
  client: {
    marginTop: 4,
    fontSize: 13,
    color: C.muted,
  },

  // ───────── Goal hero card ─────────
  goalHero: {
    marginTop: 22,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: C.pastelViolet,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: C.accentViolet,
  },
  goalHeroLabel: {
    fontSize: 7,
    letterSpacing: 2.2,
    color: C.accentViolet,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  goalHeroText: {
    fontSize: 13,
    lineHeight: 1.45,
    color: C.ink,
  },

  // ───────── Description (compact, plain) ─────────
  description: {
    marginTop: 14,
    fontSize: 10.5,
    lineHeight: 1.55,
    color: C.inkSoft,
  },

  // ───────── KPI grid ─────────
  kpiRow: {
    marginTop: 22,
    flexDirection: "row",
    gap: 8,
  },
  kpiCell: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: C.ruleSoft,
  },
  kpiCellCyan: {
    backgroundColor: C.pastelCyan,
  },
  kpiCellViolet: {
    backgroundColor: C.pastelViolet,
  },
  kpiCellPink: {
    backgroundColor: C.pastelPink,
  },
  kpiCellMint: {
    backgroundColor: C.pastelMint,
  },
  kpiLabel: {
    fontSize: 7,
    letterSpacing: 1.5,
    color: C.inkSoft,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    opacity: 0.7,
  },
  kpiValue: {
    marginTop: 4,
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.5,
  },

  // ───────── Meta strip ─────────
  metaStrip: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 22,
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderTopColor: C.rule,
  },
  metaItem: {
    minWidth: 110,
  },
  metaLabel: {
    fontSize: 6.5,
    letterSpacing: 1.5,
    color: C.muted,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
  },
  metaSub: {
    fontSize: 8,
    color: C.muted,
    marginTop: 1,
  },

  // ───────── Section header ─────────
  sectionLabel: {
    fontSize: 8,
    letterSpacing: 2.5,
    color: C.accentViolet,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginTop: 22,
    marginBottom: 10,
  },

  // ───────── Tools & Links ─────────
  linksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  linkCard: {
    width: "48%",
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 8,
    backgroundColor: C.ruleSoft,
    flexDirection: "row",
    gap: 9,
  },
  linkBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.pastelViolet,
  },
  linkBadgeText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.accentViolet,
  },
  linkBody: {
    flex: 1,
  },
  linkName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  linkMeta: {
    fontSize: 7.5,
    color: C.muted,
    marginTop: 1,
  },
  linkNotes: {
    fontSize: 7.5,
    color: C.inkSoft,
    marginTop: 2,
    fontStyle: "italic",
  },

  // ───────── Tags ─────────
  tagsRow: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  tag: {
    fontSize: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: C.ruleSoft,
    color: C.muted,
  },

  // ───────── Day header ─────────
  dayHeader: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: C.pastelViolet,
    marginBottom: 18,
  },
  dayHeaderEyebrow: {
    fontSize: 7,
    letterSpacing: 2,
    color: C.accentViolet,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  dayTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.4,
  },
  dayMeta: {
    marginTop: 4,
    fontSize: 9.5,
    color: C.inkSoft,
  },

  // ───────── Block row ─────────
  blockRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  blockTimeCol: {
    width: 64,
    alignItems: "flex-end",
  },
  blockTimeStart: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.2,
  },
  blockTimeEnd: {
    fontSize: 7.5,
    color: C.muted,
    marginTop: 2,
  },
  blockDuration: {
    marginTop: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: C.ruleSoft,
    fontSize: 7,
    letterSpacing: 1,
    color: C.muted,
    fontFamily: "Helvetica-Bold",
  },
  blockBody: {
    flex: 1,
    paddingTop: 2,
    paddingLeft: 14,
    paddingRight: 14,
    paddingBottom: 14,
    borderRadius: 10,
    backgroundColor: C.paperSoft,
    borderLeftWidth: 3,
    borderLeftColor: C.rule,
  },
  blockHeader: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    alignItems: "center",
    marginBottom: 5,
  },
  blockTag: {
    fontSize: 7,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
  blockTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.2,
    lineHeight: 1.3,
  },
  blockDescription: {
    marginTop: 5,
    fontSize: 9.5,
    color: C.inkSoft,
    lineHeight: 1.55,
  },
  trainerNote: {
    marginTop: 7,
    paddingVertical: 7,
    paddingHorizontal: 9,
    backgroundColor: C.trainerBg,
    borderRadius: 6,
    borderLeftWidth: 2,
    borderLeftColor: C.trainerAccent,
  },
  trainerNoteLabel: {
    fontSize: 6.5,
    letterSpacing: 1.4,
    color: C.trainerAccent,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  trainerNoteText: {
    fontSize: 9,
    lineHeight: 1.45,
    color: C.ink,
  },
  taskList: {
    marginTop: 7,
  },
  taskItem: {
    flexDirection: "row",
    gap: 6,
    fontSize: 9,
    marginBottom: 2,
  },
  childList: {
    marginTop: 7,
    paddingLeft: 10,
    borderLeftWidth: 0.5,
    borderLeftColor: C.rule,
  },
  childItem: {
    flexDirection: "row",
    gap: 8,
    fontSize: 8.5,
    marginBottom: 2,
  },
  childItemDuration: {
    width: 30,
    fontFamily: "Helvetica-Bold",
    color: C.accentViolet,
  },
  childItemTitle: {
    flex: 1,
    color: C.inkSoft,
  },
  blockMaterials: {
    marginTop: 7,
    fontSize: 8.5,
    color: C.muted,
  },

  // ───────── NOTE block ─────────
  noteBlock: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: C.noteBg,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#fbbf24",
  },
  noteLabel: {
    fontSize: 6.5,
    letterSpacing: 1.5,
    color: C.noteAccent,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  noteText: {
    fontSize: 10,
    lineHeight: 1.4,
  },

  // ───────── Appendix ─────────
  appendixCard: {
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 8,
    backgroundColor: C.paperSoft,
    marginBottom: 6,
  },
  appendixRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: C.ruleSoft,
    fontSize: 10,
    marginBottom: 3,
  },
  appendixQty: {
    width: 32,
    fontFamily: "Helvetica-Bold",
    color: C.accentViolet,
  },
  appendixName: {
    flex: 1,
  },
  appendixSub: {
    fontSize: 8,
    color: C.muted,
  },
  trainerCardName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  trainerCardBlocks: {
    fontSize: 8.5,
    color: C.muted,
    marginTop: 3,
    lineHeight: 1.5,
  },

  // ───────── Footer ─────────
  footer: {
    position: "absolute",
    bottom: 26,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: C.mutedSoft,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: C.ruleSoft,
  },
  footerBrand: {
    fontFamily: "Helvetica-Bold",
    color: C.accentViolet,
  },
});

function formatDate(d: Date | string | null): string {
  if (!d) return "Datum offen";
  return new Date(d).toLocaleDateString("de-CH", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// UNION wordmark — 5 paths from /public/union-logo.svg, viewBox 320×75.
function UnionMark({ color, height = 9 }: { color: string; height?: number }) {
  const width = (height * 320) / 75;
  return (
    <Svg viewBox="0 0 320 75" width={width} height={height}>
      <Path
        d="M31.9228 74.2207C22.479 74.2207 14.8308 71.7267 8.97828 66.7387C2.99276 61.7508 0 54.6347 0 45.3903V1.59619H19.9517V45.5899C19.9517 49.3142 20.9826 52.174 23.0443 54.1691C25.1724 56.1643 28.1319 57.1619 31.9228 57.1619C35.7136 57.1619 38.6399 56.1643 40.7015 54.1691C42.8297 52.174 43.8938 49.3142 43.8938 45.5899V1.59619H63.8455V45.3903C63.8455 54.7677 60.9525 61.9171 55.1665 66.8385C49.314 71.7599 41.5661 74.2207 31.9228 74.2207Z"
        fill={color}
      />
      <Path
        d="M118.178 13.1665V1.59448H137.132V72.6228H116.083L101.02 47.3838C96.9629 40.5337 93.7041 34.6812 91.2434 29.8262C91.576 39.6026 91.7422 50.0108 91.7422 61.0508V72.6228H72.7881V1.59448H93.8372L108.901 26.8335C112.492 32.952 115.751 38.8378 118.677 44.4908C118.345 34.7144 118.178 24.273 118.178 13.1665Z"
        fill={color}
      />
      <Path
        d="M167.063 72.6228H147.111V1.59448H167.063V72.6228Z"
        fill={color}
      />
      <Path
        d="M238.382 64.0452C231.532 70.8288 222.521 74.2206 211.348 74.2206C200.175 74.2206 191.163 70.8288 184.313 64.0452C177.463 57.3946 174.038 48.4163 174.038 37.1103C174.038 25.8708 177.463 16.8593 184.313 10.0756C191.23 3.35855 200.241 0 211.348 0C222.454 0 231.466 3.35855 238.382 10.0756C245.233 16.8593 248.658 25.8708 248.658 37.1103C248.658 48.4163 245.233 57.3946 238.382 64.0452ZM199.277 51.6751C202.27 55.1999 206.293 56.9623 211.348 56.9623C216.402 56.9623 220.426 55.1999 223.419 51.6751C226.411 48.2168 227.908 43.3619 227.908 37.1103C227.908 30.9918 226.411 26.1701 223.419 22.6453C220.426 19.0539 216.402 17.2583 211.348 17.2583C206.293 17.2583 202.27 19.0539 199.277 22.6453C196.284 26.1701 194.788 30.9918 194.788 37.1103C194.788 43.3619 196.284 48.2168 199.277 51.6751Z"
        fill={color}
      />
      <Path
        d="M301.055 13.1665V1.59448H320.009V72.6228H298.96L283.897 47.3838C279.84 40.5337 276.581 34.6812 274.12 29.8262C274.453 39.6026 274.619 50.0108 274.619 61.0508V72.6228H255.665V1.59448H276.714L291.778 26.8335C295.369 32.952 298.628 38.8378 301.554 44.4908C301.221 34.7144 301.055 24.273 301.055 13.1665Z"
        fill={color}
      />
    </Svg>
  );
}

// "MySession by UNION" rendered as a real PNG via /api/brand/mysession-logo.png.
// We need a PNG (not SVG) because @react-pdf's <Image> component doesn't support
// SVG, and we need an actual rendered logo (not a Helvetica approximation).
function BrandBar({
  logoUrl,
  size = "default",
}: {
  logoUrl: string;
  size?: "default" | "small";
}) {
  // PNG aspect ratio is 1040 / 480 = 2.166...
  const height = size === "small" ? 22 : 38;
  const width = (height * 1040) / 480;
  return (
    <Image
      src={logoUrl}
      style={{ width, height, objectFit: "contain" }}
    />
  );
}

function PageFooter({ workshopTitle }: { workshopTitle: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>
        <Text style={styles.footerBrand}>MySession</Text> · {workshopTitle}
      </Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `${pageNumber} / ${totalPages}`
        }
      />
    </View>
  );
}

type DayComputed = {
  id: string;
  title: string | null;
  position: number;
  startTime: string;
  endTime: string;
  duration: number;
  enrichedTop: Array<
    Block & {
      computedStartTime: string;
      computedEndTime: string;
      effectiveDuration: number;
      children: Block[];
    }
  >;
};

export function WorkshopPdf({
  workshop,
  links,
  organization,
  trainerName,
  logoUrl,
}: {
  workshop: WorkshopWithBlocks;
  links: WorkshopLink[];
  organization: { id: string; name: string } | null;
  trainerName: string;
  logoUrl: string;
}) {
  const days: DayComputed[] = workshop.days.map((d) => {
    const top = d.blocks.filter((b) => b.parentBlockId === null);
    const childrenByParent = new Map<string, Block[]>();
    for (const b of d.blocks) {
      if (b.parentBlockId) {
        const arr = childrenByParent.get(b.parentBlockId) ?? [];
        arr.push(b);
        childrenByParent.set(b.parentBlockId, arr);
      }
    }
    const inputs = top.map((b) => {
      let eff = b.duration;
      if (b.type === "GROUP") {
        const ch = (childrenByParent.get(b.id) ?? []).filter(
          (c) => c.column === 0
        );
        eff = sumChildDurations(ch);
      } else if (b.type === "BREAKOUT") {
        const cols = new Map<number, number>();
        for (const c of childrenByParent.get(b.id) ?? []) {
          if (c.type === "NOTE") continue;
          cols.set(c.column, (cols.get(c.column) ?? 0) + c.duration);
        }
        eff = cols.size ? Math.max(...cols.values()) : 0;
      }
      return {
        id: b.id,
        position: b.position,
        duration: eff,
        locked: b.locked,
        startTime: b.startTime,
        type: b.type,
      };
    });
    const recalced = recalcBlocks(inputs, d.startTime);
    const recalcById = new Map(recalced.map((r) => [r.id, r]));
    const enrichedTop = top.map((b) => {
      const rc = recalcById.get(b.id);
      const eff = inputs.find((i) => i.id === b.id)?.duration ?? b.duration;
      return {
        ...b,
        computedStartTime: rc?.computedStartTime ?? d.startTime,
        computedEndTime: rc?.computedEndTime ?? d.startTime,
        effectiveDuration: eff,
        children: childrenByParent.get(b.id) ?? [],
      };
    });
    return {
      id: d.id,
      title: d.title,
      position: d.position,
      startTime: d.startTime,
      endTime:
        recalced.length > 0
          ? recalced[recalced.length - 1].computedEndTime
          : d.startTime,
      duration: totalDuration(
        inputs.map((i) => ({ duration: i.duration, type: i.type }))
      ),
      enrichedTop,
    };
  });

  const totalMinutes = days.reduce((s, d) => s + d.duration, 0);
  const totalBlocks = days.reduce((s, d) => s + d.enrichedTop.length, 0);

  const allBlocks = workshop.days.flatMap((d) => d.blocks);
  const allMaterials = allBlocks.flatMap((b) =>
    (b.materials ?? []).map((m) => ({
      ...m,
      blockTitle: b.title || "Unbenannt",
    }))
  );
  const physicalMaterials = allMaterials.filter((m) => !m.url);

  const materialsByName = new Map<
    string,
    { name: string; quantity: number | null; blocks: string[] }
  >();
  for (const m of physicalMaterials) {
    const existing = materialsByName.get(m.name);
    if (existing) {
      existing.quantity =
        (existing.quantity ?? 0) + (m.quantity ?? 0) || existing.quantity;
      existing.blocks.push(m.blockTitle);
    } else {
      materialsByName.set(m.name, {
        name: m.name,
        quantity: m.quantity,
        blocks: [m.blockTitle],
      });
    }
  }
  const aggregatedMaterials = Array.from(materialsByName.values()).sort(
    (a, b) => a.name.localeCompare(b.name)
  );

  const trainerMap = new Map<string, { name: string; blocks: string[] }>();
  for (const b of allBlocks) {
    if (b.assignedTo) {
      const existing = trainerMap.get(b.assignedTo.id);
      if (existing) {
        existing.blocks.push(b.title || "Unbenannt");
      } else {
        trainerMap.set(b.assignedTo.id, {
          name: b.assignedTo.name,
          blocks: [b.title || "Unbenannt"],
        });
      }
    }
  }
  const trainers = Array.from(trainerMap.values());

  const blocksWithNotes = allBlocks
    .filter((b) => b.notes && b.notes.trim().length > 0)
    .map((b) => ({
      blockTitle: b.title || "Unbenannt",
      notes: b.notes ?? "",
    }));

  const dateStr = formatDate(workshop.startDate);
  const timeStr = days[0]
    ? `${days[0].startTime} – ${days[days.length - 1].endTime}`
    : "—";

  const hasAppendix =
    aggregatedMaterials.length > 0 ||
    trainers.length > 0 ||
    blocksWithNotes.length > 0;

  const statusPillStyle = (() => {
    if (workshop.status === "RUNNING") {
      return { backgroundColor: C.pillRunning, color: C.pillRunningText };
    }
    if (workshop.status === "SCHEDULED") {
      return { backgroundColor: C.pillScheduled, color: C.pillScheduledText };
    }
    return { backgroundColor: C.pillNeutral, color: C.pillNeutralText };
  })();

  return (
    <Document
      title={workshop.title}
      author={trainerName}
      subject="Workshop-Plan"
      creator="MySession by UNION"
    >
      {/* ────── SUMMARY (Seite 1) — alles wichtige auf einen Blick ────── */}
      <Page size="A4" style={styles.pageSummary}>
        {/* Aurora decoration */}
        <View style={styles.auroraTopRight} fixed />
        <View style={styles.auroraMidViolet} fixed />
        <View style={styles.auroraBottomLeft} fixed />

        <View style={styles.brandBar}>
          <BrandBar logoUrl={logoUrl} size="default" />
          <Text style={styles.eyebrow}>Workshop-Plan</Text>
        </View>

        <View style={styles.pillRow}>
          <Text style={[styles.pill, statusPillStyle]}>
            {STATUS_LABEL[workshop.status] ?? workshop.status}
          </Text>
          {organization ? (
            <Text
              style={[
                styles.pill,
                { backgroundColor: C.pillNeutral, color: C.pillNeutralText },
              ]}
            >
              {organization.name}
            </Text>
          ) : null}
        </View>

        <Text style={styles.title}>{workshop.title}</Text>
        {workshop.clientName ? (
          <Text style={styles.client}>{workshop.clientName}</Text>
        ) : null}

        {workshop.goals ? (
          <View style={styles.goalHero}>
            <Text style={styles.goalHeroLabel}>Zielsetzung</Text>
            <Text style={styles.goalHeroText}>{workshop.goals}</Text>
          </View>
        ) : (
          <View style={styles.goalHeroEmpty}>
            <Text style={styles.goalHeroLabel}>Zielsetzung</Text>
            <Text style={styles.goalHeroEmptyText}>
              Noch keine Zielsetzung erfasst — im Editor unter „Zielsetzung"
              hinzufügen.
            </Text>
          </View>
        )}

        {workshop.description ? (
          <Text style={styles.description}>{workshop.description}</Text>
        ) : null}

        <View style={styles.kpiRow}>
          <View style={[styles.kpiCell, styles.kpiCellCyan]}>
            <Text style={styles.kpiLabel}>Tage</Text>
            <Text style={styles.kpiValue}>{days.length}</Text>
          </View>
          <View style={[styles.kpiCell, styles.kpiCellViolet]}>
            <Text style={styles.kpiLabel}>Gesamtdauer</Text>
            <Text style={styles.kpiValue}>{formatDuration(totalMinutes)}</Text>
          </View>
          <View style={[styles.kpiCell, styles.kpiCellPink]}>
            <Text style={styles.kpiLabel}>Blöcke</Text>
            <Text style={styles.kpiValue}>{totalBlocks}</Text>
          </View>
          <View style={[styles.kpiCell, styles.kpiCellMint]}>
            <Text style={styles.kpiLabel}>Materialien</Text>
            <Text style={styles.kpiValue}>{aggregatedMaterials.length}</Text>
          </View>
        </View>

        <View style={styles.metaStrip}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Datum</Text>
            <Text style={styles.metaValue}>{dateStr}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Zeitfenster</Text>
            <Text style={styles.metaValue}>{timeStr}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Erstellt von</Text>
            <Text style={styles.metaValue}>{trainerName}</Text>
            <Text style={styles.metaSub}>
              {new Date(workshop.createdAt).toLocaleDateString("de-CH")}
            </Text>
          </View>
        </View>

        {links.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>Tools & Links</Text>
            <View style={styles.linksGrid}>
              {links.map((l) => {
                const meta = detectLinkKind(l.url);
                const host = safeHost(l.url) ?? l.url;
                return (
                  <View key={l.id} style={styles.linkCard}>
                    <View style={styles.linkBadge}>
                      <Text style={styles.linkBadgeText}>
                        {meta.label.slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.linkBody}>
                      <Text style={styles.linkName}>{l.name}</Text>
                      <Text style={styles.linkMeta}>
                        {meta.label} · {host}
                      </Text>
                      {l.notes ? (
                        <Text style={styles.linkNotes}>{l.notes}</Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        ) : null}

        {workshop.tags.length > 0 ? (
          <View style={styles.tagsRow}>
            {workshop.tags.map((t) => (
              <Text key={t} style={styles.tag}>
                #{t}
              </Text>
            ))}
          </View>
        ) : null}

        <PageFooter workshopTitle={workshop.title} />
      </Page>

      {/* ────── DAY PAGES ────── */}
      {days.map((d) => (
        <Page key={d.id} size="A4" style={styles.page}>
          <View style={styles.brandBar}>
            <BrandBar logoUrl={logoUrl} size="small" />
            <Text style={styles.eyebrow}>
              Tag {d.position + 1} / {days.length}
            </Text>
          </View>
          <View style={styles.dayHeader}>
            <Text style={styles.dayHeaderEyebrow}>
              Ablauf · Tag {d.position + 1} von {days.length}
            </Text>
            <Text style={styles.dayTitle}>
              {d.title || `Tag ${d.position + 1}`}
            </Text>
            <Text style={styles.dayMeta}>
              {d.startTime} – {d.endTime} · {formatDuration(d.duration)} ·{" "}
              {d.enrichedTop.length} Blöcke
            </Text>
          </View>

          {d.enrichedTop.map((b) => {
            const isNote = b.type === "NOTE";
            if (isNote) {
              return (
                <View key={b.id} style={styles.blockRow} wrap={false}>
                  <View style={styles.blockTimeCol} />
                  <View style={[styles.noteBlock, { flex: 1 }]}>
                    <Text style={styles.noteLabel}>Notiz</Text>
                    <Text style={styles.noteText}>{b.title || "(leer)"}</Text>
                  </View>
                </View>
              );
            }

            const accentHex = b.category
              ? oklchToHex(b.category.color)
              : C.rule;
            const tintBg = b.category
              ? withAlpha(b.category.color, 0.06)
              : C.paperSoft;
            return (
              <View key={b.id} style={styles.blockRow} wrap={false}>
                <View style={styles.blockTimeCol}>
                  <Text style={styles.blockTimeStart}>
                    {b.computedStartTime}
                  </Text>
                  <Text style={styles.blockTimeEnd}>
                    bis {b.computedEndTime}
                  </Text>
                  <Text style={styles.blockDuration}>
                    {formatDuration(b.effectiveDuration)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.blockBody,
                    {
                      backgroundColor: tintBg,
                      borderLeftColor: accentHex,
                    },
                  ]}
                >
                  <Text style={styles.blockTitle}>
                    {b.title || "Unbenannt"}
                  </Text>
                  {(b.type !== "BLOCK" ||
                    b.category ||
                    b.method ||
                    b.assignedTo) && (
                    <View style={styles.blockHeader}>
                      {b.type !== "BLOCK" ? (
                        <Text
                          style={[
                            styles.blockTag,
                            {
                              backgroundColor: C.ruleSoft,
                              color: C.muted,
                            },
                          ]}
                        >
                          {BLOCK_TYPE_LABEL[b.type] ?? b.type}
                        </Text>
                      ) : null}
                      {b.category ? (
                        <Text
                          style={[
                            styles.blockTag,
                            {
                              backgroundColor: withAlpha(b.category.color, 0.18),
                              color: accentHex,
                            },
                          ]}
                        >
                          {b.category.name}
                        </Text>
                      ) : null}
                      {b.method ? (
                        <Text
                          style={[
                            styles.blockTag,
                            {
                              backgroundColor: C.pastelViolet,
                              color: C.accentViolet,
                            },
                          ]}
                        >
                          {b.method.title}
                        </Text>
                      ) : null}
                      {b.assignedTo ? (
                        <Text
                          style={[
                            styles.blockTag,
                            {
                              backgroundColor: C.pastelPink,
                              color: C.accentPink,
                            },
                          ]}
                        >
                          {b.assignedTo.name}
                        </Text>
                      ) : null}
                    </View>
                  )}
                  {b.description ? (
                    <Text style={styles.blockDescription}>{b.description}</Text>
                  ) : null}

                  {b.notes ? (
                    <View style={styles.trainerNote}>
                      <Text style={styles.trainerNoteLabel}>Trainer-Notiz</Text>
                      <Text style={styles.trainerNoteText}>{b.notes}</Text>
                    </View>
                  ) : null}

                  {b.tasks && b.tasks.length > 0 ? (
                    <View style={styles.taskList}>
                      {b.tasks.map((t) => (
                        <View key={t.id} style={styles.taskItem}>
                          <Text>{t.done ? "☑" : "☐"}</Text>
                          <Text style={{ flex: 1 }}>{t.text}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {b.children.length > 0 ? (
                    <View style={styles.childList}>
                      {b.children
                        .sort(
                          (a, b) => a.column - b.column || a.position - b.position
                        )
                        .map((c) => (
                          <View key={c.id} style={styles.childItem}>
                            <Text style={styles.childItemDuration}>
                              {c.duration}m
                            </Text>
                            <Text style={styles.childItemTitle}>
                              {c.title || "Unbenannt"}
                            </Text>
                          </View>
                        ))}
                    </View>
                  ) : null}

                  {b.materials && b.materials.length > 0 ? (
                    <Text style={styles.blockMaterials}>
                      Material:{" "}
                      {b.materials
                        .map((m) =>
                          m.quantity ? `${m.quantity}× ${m.name}` : m.name
                        )
                        .join(", ")}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}

          <PageFooter workshopTitle={workshop.title} />
        </Page>
      ))}

      {/* ────── APPENDIX ────── */}
      {hasAppendix ? (
        <Page size="A4" style={styles.page}>
          <View style={styles.brandBar}>
            <BrandBar logoUrl={logoUrl} size="small" />
            <Text style={styles.eyebrow}>Anhang</Text>
          </View>
          <Text style={styles.title}>Material, Trainer:innen & Notizen</Text>

          {aggregatedMaterials.length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>
                Materialliste ({aggregatedMaterials.length})
              </Text>
              {aggregatedMaterials.map((m) => (
                <View key={m.name} style={styles.appendixRow}>
                  <Text style={styles.appendixQty}>
                    {m.quantity ? `${m.quantity}×` : ""}
                  </Text>
                  <Text style={styles.appendixName}>{m.name}</Text>
                  <Text style={styles.appendixSub}>
                    {m.blocks.length === 1
                      ? m.blocks[0]
                      : `${m.blocks.length} Blöcke`}
                  </Text>
                </View>
              ))}
            </>
          ) : null}

          {trainers.length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>
                Trainer-Zuweisungen ({trainers.length})
              </Text>
              {trainers.map((t) => (
                <View key={t.name} style={styles.appendixCard} wrap={false}>
                  <Text style={styles.trainerCardName}>{t.name}</Text>
                  <Text style={styles.trainerCardBlocks}>
                    {t.blocks.length} Block{t.blocks.length === 1 ? "" : "s"}:{" "}
                    {t.blocks.join(" · ")}
                  </Text>
                </View>
              ))}
            </>
          ) : null}

          {blocksWithNotes.length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>
                Trainer-Notizen ({blocksWithNotes.length})
              </Text>
              {blocksWithNotes.map((n, i) => (
                <View key={i} style={styles.appendixCard} wrap={false}>
                  <Text style={styles.trainerCardName}>{n.blockTitle}</Text>
                  <Text style={styles.trainerCardBlocks}>{n.notes}</Text>
                </View>
              ))}
            </>
          ) : null}

          <PageFooter workshopTitle={workshop.title} />
        </Page>
      ) : null}
    </Document>
  );
}
