import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { recalcBlocks, totalDuration } from "@/lib/recalc";

export type WorkshopFilter = "mine" | "myOrg" | "all" | "archived";

export async function listWorkshopsForUser(
  userId: string,
  organizationId: string | null,
  filter: WorkshopFilter = "all"
) {
  let where: Prisma.WorkshopWhereInput = {};

  if (filter === "archived") {
    // Archived ones across the whole UNION — quasi a recycle-bin / cold storage.
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
  } else if (filter === "myOrg" && organizationId) {
    where = { organizationId, NOT: { status: "ARCHIVED" } };
  } else {
    // "all" → exclude archived
    where = { NOT: { status: "ARCHIVED" } };
  }

  const workshops = await prisma.workshop.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
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

export async function getOrganization(orgId: string) {
  return prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, slug: true, parentOrgId: true },
  });
}

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
      createdBy: {
        select: { id: true, name: true, username: true },
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
                select: { id: true, title: true },
              },
              tasks: {
                orderBy: { position: "asc" },
              },
              materials: {
                orderBy: { name: "asc" },
              },
            },
          },
        },
      },
    },
  });
}

export async function getCategoriesForUser(userId: string) {
  return prisma.blockCategory.findMany({
    where: {
      OR: [{ isSystem: true }, { createdById: userId }],
    },
    orderBy: [{ isSystem: "desc" }, { position: "asc" }],
  });
}

export async function listAllUsers() {
  return prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      avatarUrl: true,
    },
  });
}

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
    },
  });
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
