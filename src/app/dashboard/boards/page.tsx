import { redirect } from "next/navigation";
import { auth } from "@/auth/auth";
import { listBoards } from "@/lib/queries";
import { BoardsLibrary } from "@/components/boards/boards-library";

export default async function BoardsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const boards = await listBoards();

  return (
    <BoardsLibrary
      boards={boards}
      currentUserId={session.user.id}
      isAdmin={session.user.role === "ADMIN"}
    />
  );
}
