import { unstable_cache } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { recalcBlocks, totalDuration } from "@/lib/recalc";

/**
 * Filter values:
 *  - "mine"     — workshops the user created or that are shared with them
 *  - "all"      — every active (non-archived) workshop in the UNION
 *  - "archived" — archived workshops only
 *  - any other string is treated as an organizationId
 */
export type WorkshopFilter = string;

async function listWorkshopsForUserUncached(
  userId: string,
  filter: WorkshopFilter
) {
  let where: Prisma.WorkshopWhereInput;
  if (filter === "archived") {
    where = { status: "ARCHIVED", isMethodDraft: false };
  } else if (filter === "mine") {
    where = {
      AND: [
        {
          OR: [
            { createdById: userId },
            { shares: { some: { userId } } },
          ],
        },
        { NOT: { status: "ARCHIVED" } },
        { isMethodDraft: false },
      ],
    };
  } else if (filter === "all") {
    where = { NOT: { status: "ARCHIVED" }, isMethodDraft: false };
  } else {
    // Treat any other value as an organizationId
    where = {
      organizationId: filter,
      NOT: { status: "ARCHIVED" },
      isMethodDraft: false,
    };
  }

  const workshops = await prisma.workshop.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      organization: {
        select: { id: true, name: true, slug: true, parentOrgId: true },
      },
      createdBy: { select: { id: true, name: true, username: true } },
      days: {
        orderBy: { position: "asc" },
        include: {
          blocks: {
            where: { parentBlockId: null },
            orderBy: { position: "asc" },
            select: {
              id: true,
              position: true,
              duration: true,
              locked: true,
              startTime: true,
              type: true,
            },
          },
        },
      },
    },
  });

  return workshops.map((w) => {
    const allBlocks = w.days.flatMap((d) => d.blocks);
    const blockCount = allBlocks.length;
    const firstDay = w.days[0];
    const recalced = firstDay
      ? recalcBlocks(firstDay.blocks, firstDay.startTime)
      : [];
    const startTime = firstDay?.startTime ?? "09:00";
    const endTime = recalced.length
      ? recalced[recalced.length - 1].computedEndTime
      : startTime;
    return {
      id: w.id,
      title: w.title,
      clientName: w.clientName,
      status: w.status,
      tags: w.tags,
      startDate: w.startDate,
      blockCount,
      durationMinutes: totalDuration(allBlocks),
      startTime,
      endTime,
      updatedAt: w.updatedAt,
      organization: w.organization,
      createdBy: w.createdBy,
      isMine: w.createdById === userId,
    };
  });
}

// Cached wrapper — invalidated by `revalidateTag("workshops")` in workshop &
// share actions. 60s revalidate keeps stale data short for cross-user changes
// (e.g. UNION-tab seeing someone else's new workshop) while still serving most
// requests from cache.
const cachedListWorkshopsForUser = unstable_cache(
  async (userId: string, filter: WorkshopFilter) =>
    listWorkshopsForUserUncached(userId, filter),
  ["workshops:list"],
  { revalidate: 60, tags: ["workshops"] }
);

export async function listWorkshopsForUser(
  userId: string,
  _organizationId: string | null,
  filter: WorkshopFilter = "mine"
) {
  return cachedListWorkshopsForUser(userId, filter);
}

export async function getOrganizationsInUnion() {
  return prisma.organization.findMany({
    orderBy: [{ parentOrgId: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      parentOrgId: true,
    },
  });
}

export const getOrganization = unstable_cache(
  async (orgId: string) =>
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true, slug: true, parentOrgId: true },
    }),
  ["organization"],
  { revalidate: 600, tags: ["organizations"] }
);

export const listMethods = unstable_cache(
  async () =>
    prisma.method.findMany({
      where: { status: "APPROVED" },
      orderBy: [{ category: "asc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        description: true,
        defaultDuration: true,
        category: true,
        tags: true,
        isPublic: true,
        status: true,
        createdAt: true,
        approvedAt: true,
        createdBy: { select: { id: true, name: true, username: true } },
      },
    }),
  ["methods:approved"],
  { revalidate: 300, tags: ["methods"] }
);

export type MethodListItem = Awaited<ReturnType<typeof listMethods>>[number];

export async function listMethodsForUser(
  userId: string,
  filter: "approved" | "mine" | "pending" = "approved"
) {
  const where =
    filter === "approved"
      ? { status: "APPROVED" as const }
      : filter === "mine"
      ? { createdById: userId }
      : { status: "PENDING" as const };

  return prisma.method.findMany({
    where,
    orderBy:
      filter === "approved"
        ? [{ category: "asc" }, { title: "asc" }]
        : { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      defaultDuration: true,
      category: true,
      tags: true,
      isPublic: true,
      status: true,
      rejectedReason: true,
      createdAt: true,
      approvedAt: true,
      createdBy: { select: { id: true, name: true, username: true } },
    },
  });
}

export type MethodListItemForUser = Awaited<
  ReturnType<typeof listMethodsForUser>
>[number];

export async function listTemplatesForUser(
  userId: string,
  filter: "approved" | "mine" | "pending" = "approved"
) {
  const where =
    filter === "approved"
      ? { status: "APPROVED" as const }
      : filter === "mine"
      ? { createdById: userId }
      : { status: "PENDING" as const };

  return prisma.template.findMany({
    where,
    orderBy:
      filter === "approved"
        ? [{ avgRating: "desc" }, { createdAt: "desc" }]
        : { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      theme: true,
      tags: true,
      duration: true,
      status: true,
      rejectedReason: true,
      avgRating: true,
      ratingCount: true,
      useCount: true,
      createdAt: true,
      approvedAt: true,
      createdBy: { select: { id: true, name: true, username: true } },
      approvedBy: { select: { id: true, name: true } },
      ratings: {
        where: { userId },
        select: { score: true, comment: true },
      },
    },
  });
}

export type TemplateListItem = Awaited<
  ReturnType<typeof listTemplatesForUser>
>[number];

export async function listWorkshopVersions(workshopId: string) {
  return prisma.workshopVersion.findMany({
    where: { workshopId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      label: true,
      kind: true,
      createdAt: true,
      createdBy: { select: { id: true, name: true, username: true } },
    },
  });
}

export type WorkshopVersionSummary = Awaited<
  ReturnType<typeof listWorkshopVersions>
>[number];

/**
 * Lightweight workshop summary for fast hero/header rendering — no days,
 * no blocks. Pair with `getWorkshopWithBlocks` in a separate Suspense for
 * detail aggregations.
 */
export async function getWorkshopHeader(workshopId: string) {
  return prisma.workshop.findUnique({
    where: { id: workshopId },
    select: {
      id: true,
      title: true,
      goals: true,
      description: true,
      status: true,
      clientName: true,
      tags: true,
      startDate: true,
      timezone: true,
      createdAt: true,
      updatedAt: true,
      organization: {
        select: { id: true, name: true, slug: true, parentOrgId: true },
      },
      createdBy: { select: { id: true, name: true, username: true } },
    },
  });
}

export async function getWorkshopWithBlocks(workshopId: string) {
  return prisma.workshop.findUnique({
    where: { id: workshopId },
    include: {
      organization: {
        select: { id: true, name: true, slug: true, parentOrgId: true },
      },
      createdBy: {
        select: { id: true, name: true, username: true },
      },
      shares: {
        include: {
          user: {
            select: { id: true, name: true, username: true, email: true },
          },
        },
      },
      days: {
        orderBy: { position: "asc" },
        include: {
          blocks: {
            orderBy: [{ position: "asc" }, { column: "asc" }],
            include: {
              category: true,
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  email: true,
                  avatarUrl: true,
                },
              },
              method: {
                select: { id: true, title: true, category: true },
              },
              tasks: {
                orderBy: { position: "asc" },
              },
              materials: {
                orderBy: { name: "asc" },
              },
              comments: {
                orderBy: { createdAt: "asc" },
                include: {
                  author: {
                    select: { id: true, name: true, username: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}

/**
 * Public token-based fetch for the read-only client share view.
 * - Skips authentication.
 * - Strips trainer-only fields (`block.notes`, comments) from the result.
 * - Validates token, expiry and revocation server-side.
 * - Increments `viewCount` and `lastViewAt` on success (fire-and-forget).
 * Returns null when the link is invalid / expired / revoked / workshop missing.
 */
export async function getWorkshopByShareToken(token: string) {
  if (!token || typeof token !== "string" || token.length < 16) return null;

  const link = await prisma.workshopShareLink.findUnique({
    where: { token },
    select: {
      id: true,
      workshopId: true,
      label: true,
      expiresAt: true,
      revokedAt: true,
    },
  });
  if (!link) return null;
  if (link.revokedAt) return null;
  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) return null;

  const workshop = await prisma.workshop.findUnique({
    where: { id: link.workshopId },
    include: {
      organization: {
        select: { id: true, name: true, slug: true },
      },
      createdBy: {
        select: { id: true, name: true },
      },
      days: {
        orderBy: { position: "asc" },
        include: {
          blocks: {
            orderBy: [{ position: "asc" }, { column: "asc" }],
            select: {
              id: true,
              dayId: true,
              position: true,
              column: true,
              type: true,
              title: true,
              description: true,
              duration: true,
              locked: true,
              startTime: true,
              parentBlockId: true,
              categoryId: true,
              methodId: true,
              category: true,
              method: {
                select: { id: true, title: true, category: true },
              },
              materials: {
                orderBy: { name: "asc" },
                select: {
                  id: true,
                  name: true,
                  quantity: true,
                  url: true,
                  notes: true,
                },
              },
              tasks: {
                orderBy: { position: "asc" },
                select: { id: true, text: true, done: true, position: true },
              },
            },
          },
        },
      },
      boards: {
        include: {
          board: {
            select: { id: true, title: true, url: true, kind: true, tags: true },
          },
        },
      },
    },
  });
  if (!workshop) return null;

  // Filter out method-draft sandboxes — they should never be publicly shareable.
  if (workshop.isMethodDraft) return null;

  // Fire-and-forget view tracking
  prisma.workshopShareLink
    .update({
      where: { id: link.id },
      data: { viewCount: { increment: 1 }, lastViewAt: new Date() },
    })
    .catch((err) => console.error("share-link view tracking failed", err));

  return { workshop, link };
}

export type SharedWorkshop = NonNullable<
  Awaited<ReturnType<typeof getWorkshopByShareToken>>
>["workshop"];

/**
 * List share-links for a workshop (for the Teilen-Dialog).
 */
export async function listShareLinksForWorkshop(workshopId: string) {
  return prisma.workshopShareLink.findMany({
    where: { workshopId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      token: true,
      label: true,
      email: true,
      createdAt: true,
      expiresAt: true,
      revokedAt: true,
      viewCount: true,
      lastViewAt: true,
      createdBy: {
        select: { id: true, name: true },
      },
    },
  });
}

export type ShareLinkItem = Awaited<
  ReturnType<typeof listShareLinksForWorkshop>
>[number];

export const getCategoriesForUser = unstable_cache(
  async (userId: string) =>
    prisma.blockCategory.findMany({
      where: {
        OR: [{ isSystem: true }, { createdById: userId }],
      },
      orderBy: [{ isSystem: "desc" }, { position: "asc" }],
    }),
  ["categories:user"],
  { revalidate: 120, tags: ["categories"] }
);

export const listAllUsers = unstable_cache(
  async () =>
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatarUrl: true,
      },
    }),
  ["users:all"],
  { revalidate: 300, tags: ["users"] }
);

export async function getBlockDetails(blockId: string) {
  return prisma.block.findUnique({
    where: { id: blockId },
    include: {
      assignedTo: {
        select: { id: true, name: true, username: true, avatarUrl: true },
      },
      category: true,
      tasks: {
        orderBy: { position: "asc" },
      },
      materials: {
        orderBy: { name: "asc" },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, username: true } },
        },
      },
    },
  });
}

// ────────────────────────── Boards (workshop-level link assets) ──────────────────────────

/**
 * Cross-workshop board library. Returns every Board the user can see — for now
 * that's UNION-wide. Master boards bubble to the top.
 */
export async function listBoards() {
  return prisma.board.findMany({
    orderBy: [{ isMaster: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      url: true,
      kind: true,
      notes: true,
      tags: true,
      isMaster: true,
      createdAt: true,
      updatedAt: true,
      createdBy: { select: { id: true, name: true, username: true } },
      organization: { select: { id: true, name: true, slug: true } },
      workshops: {
        select: {
          workshopId: true,
          workshop: {
            select: {
              id: true,
              title: true,
              status: true,
              startDate: true,
              tags: true,
            },
          },
        },
      },
    },
  });
}

export type BoardListItem = Awaited<ReturnType<typeof listBoards>>[number];

/** Master boards only — used in the picker dialog when attaching to a workshop. */
export async function listMasterBoards() {
  return prisma.board.findMany({
    where: { isMaster: true },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      url: true,
      kind: true,
      notes: true,
      tags: true,
    },
  });
}

export type MasterBoardItem = Awaited<ReturnType<typeof listMasterBoards>>[number];

/** Boards attached to a specific workshop, in the order they were added. */
export async function listBoardsForWorkshop(workshopId: string) {
  const rows = await prisma.workshopBoard.findMany({
    where: { workshopId },
    orderBy: { addedAt: "asc" },
    select: {
      addedAt: true,
      notes: true,
      board: {
        select: {
          id: true,
          title: true,
          url: true,
          kind: true,
          notes: true,
          tags: true,
          isMaster: true,
        },
      },
    },
  });
  return rows.map((r) => ({
    ...r.board,
    addedAt: r.addedAt,
    workshopNotes: r.notes,
  }));
}

export type WorkshopBoardItem = Awaited<
  ReturnType<typeof listBoardsForWorkshop>
>[number];

/**
 * Workshop-level link assets (materials with `url` set and no block attached).
 * LEGACY — replaced by Board/WorkshopBoard. Kept temporarily so any code still
 * calling it gets an empty array; the migration script moved existing data
 * over. Remove once all callers use listBoardsForWorkshop.
 */
export const getWorkshopLinks = unstable_cache(
  async (workshopId: string) => {
    const rows = await prisma.material.findMany({
      where: { workshopId, blockId: null, url: { not: null } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, url: true, notes: true },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      url: r.url ?? "",
      notes: r.notes,
    }));
  },
  ["workshop-links"],
  { revalidate: 300, tags: ["workshop-links"] }
);

export async function getWorkshopMaterials(workshopId: string) {
  return prisma.material.findMany({
    where: { workshopId },
    orderBy: { name: "asc" },
    include: {
      block: { select: { id: true, title: true } },
    },
  });
}

export type WorkshopWithBlocks = NonNullable<
  Awaited<ReturnType<typeof getWorkshopWithBlocks>>
>;

export type Category = Awaited<ReturnType<typeof getCategoriesForUser>>[number];

export type AppUserListItem = Awaited<ReturnType<typeof listAllUsers>>[number];

export type BlockDetails = NonNullable<
  Awaited<ReturnType<typeof getBlockDetails>>
>;
