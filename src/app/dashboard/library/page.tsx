import { redirect } from "next/navigation";
import { auth } from "@/auth/auth";
import { listMethods } from "@/lib/queries";
import { MethodLibrary } from "@/components/library/method-library";

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const methods = await listMethods();

  return (
    <MethodLibrary
      methods={methods}
      isAdmin={session.user.role === "ADMIN"}
    />
  );
}
