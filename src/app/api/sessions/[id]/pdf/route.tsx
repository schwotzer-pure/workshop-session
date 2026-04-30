import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/auth/auth";
import {
  getOrganization,
  getWorkshopLinks,
  getWorkshopWithBlocks,
} from "@/lib/queries";
import { WorkshopPdf } from "@/lib/pdf/workshop-pdf";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const [workshop, links] = await Promise.all([
    getWorkshopWithBlocks(id),
    getWorkshopLinks(id),
  ]);
  if (!workshop) {
    return new Response("Workshop nicht gefunden", { status: 404 });
  }

  const organization = workshop.organizationId
    ? await getOrganization(workshop.organizationId)
    : null;

  // Absolute URL for the brand-logo PNG so @react-pdf can fetch it.
  const origin =
    req.nextUrl.origin ||
    `https://${process.env.VERCEL_URL ?? "localhost:3200"}`;
  const logoUrl = `${origin}/api/brand/mysession-logo.png`;

  const buffer = await renderToBuffer(
    <WorkshopPdf
      workshop={workshop}
      links={links}
      organization={organization}
      trainerName={session.user.name ?? "Trainer"}
      logoUrl={logoUrl}
    />
  );

  const safeTitle = (workshop.title || "workshop")
    .replace(/[^a-z0-9äöüÄÖÜß\s_-]/gi, "")
    .replace(/\s+/g, "_")
    .slice(0, 80);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeTitle}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
