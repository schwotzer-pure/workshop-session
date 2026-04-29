import type { AppUserListItem, Category } from "@/lib/queries";
import type { TaskItem } from "./task-list";
import type { MaterialItem } from "./material-list";
import type { CommentItem } from "./comment-list";

export type BlockKind = "BLOCK" | "GROUP" | "BREAKOUT" | "NOTE";

export type BlockData = {
  id: string;
  type: BlockKind;
  title: string;
  description: string | null;
  notes: string | null;
  duration: number;
  locked: boolean;
  startTime: string | null;
  position: number;
  column: number;
  parentBlockId: string | null;
  categoryId: string | null;
  assignedToId: string | null;
  assignedTo: AppUserListItem | null;
  tasks: TaskItem[];
  materials: MaterialItem[];
  comments: CommentItem[];
};

export type EditorContext = {
  dayId: string;
  workshopId: string;
  categories: Category[];
  users: AppUserListItem[];
  onAddCategory: (cat: Category) => void;
  onLocalUpdate: (id: string, patch: Partial<BlockData>) => void;
  onLocalDelete: (id: string) => void;
  onOpenBlockDetails: (blockId: string) => void;
};
