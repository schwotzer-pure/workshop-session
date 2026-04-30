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

export async function listWorkshopsForUser(
  userId: string,
  _organizationId: string | null,
  filter: WorkshopFilter = "mine"
) {
  let where: Prisma.WorkshopWhereInput;
  if (filter === "archived") {
    where = { status: "ARCHIVED" };
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
      ],
    };
  } else if (filter === "all") {
    where = { NOT: { status: "ARCHIVED" } };
  } else {
    // Treat any other value as an organizationId
    where = { organizationId: filter, NOT: { status: "ARCHIVED" } };
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

export async function listMethods() {
  return prisma.method.findMany({
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
  });
}

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

/**
 * Workshop-level link assets (materials with `url` set and no block attached).
 * Used by the workshop header to show Miro/Figma/etc. links for the whole
 * session.
 */
export async function getWorkshopLinks(workshopId: string) {
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
}

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
