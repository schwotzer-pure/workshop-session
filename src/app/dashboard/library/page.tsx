import { redirect } from "next/navigation";
import { auth } from "@/auth/auth";
import { listMethods } from "@/lib/queries";
import { MethodLibrary } from "@/components/library/method-library";

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const methods = await listMethods();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Methoden</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wiederverwendbare Workshop-Bausteine — durchsuche, fülle deine
          Timeline mit Drag-and-Drop.
        </p>
      </div>

      <MethodLibrary methods={methods} />
    </div>
  );
}
