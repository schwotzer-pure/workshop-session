"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Markdown } from "tiptap-markdown";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Heading3,
  Strikethrough,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ToolbarButton = "bold" | "italic" | "strike" | "h3" | "bullet" | "ordered" | "link";

const COMPACT_BUTTONS: ToolbarButton[] = ["bold", "italic", "bullet", "link"];
const FULL_BUTTONS: ToolbarButton[] = [
  "bold",
  "italic",
  "strike",
  "h3",
  "bullet",
  "ordered",
  "link",
];

export function RichTextEditor({
  value,
  onChange,
  onBlur,
  placeholder,
  compact = false,
  className,
}: {
  value: string;
  onChange: (markdown: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  /** Compact mode: smaller toolbar, no headings, single-line bias. */
  compact?: boolean;
  className?: string;
}) {
  const lastEmitted = useRef(value);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: compact ? false : { levels: [3] },
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: "text-[var(--neon-violet)] underline underline-offset-2 hover:text-[var(--neon-pink)]",
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),
      Markdown.configure({
        html: false,
        tightLists: true,
        bulletListMarker: "-",
        linkify: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const storage = editor.storage as {
        markdown?: { getMarkdown: () => string };
      };
      const md = storage.markdown?.getMarkdown() ?? editor.getText();
      lastEmitted.current = md;
      onChange(md);
    },
    onBlur: () => onBlur?.(),
    editorProps: {
      attributes: {
        class: cn(
          "tiptap-prose w-full bg-transparent text-sm outline-none focus:outline-none",
          compact ? "min-h-6" : "min-h-16"
        ),
      },
    },
  });

  // Sync prop → editor when value changes externally (e.g. server reload).
  useEffect(() => {
    if (!editor) return;
    if (value === lastEmitted.current) return;
    editor.commands.setContent(value || "", { emitUpdate: false });
    lastEmitted.current = value;
  }, [editor, value]);

  if (!editor) {
    return (
      <div
        className={cn(
          "tiptap-prose w-full text-sm text-muted-foreground/60",
          compact ? "min-h-6" : "min-h-16",
          className
        )}
      >
        {value || placeholder}
      </div>
    );
  }

  const buttons = compact ? COMPACT_BUTTONS : FULL_BUTTONS;
  const isEmpty = editor.isEmpty;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex flex-wrap items-center gap-0.5">
        {buttons.map((btn) => (
          <ToolbarBtn key={btn} kind={btn} editor={editor} />
        ))}
      </div>
      <div className="relative">
        {isEmpty && placeholder ? (
          <div className="pointer-events-none absolute inset-0 text-sm text-muted-foreground/50">
            {placeholder}
          </div>
        ) : null}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarBtn({
  kind,
  editor,
}: {
  kind: ToolbarButton;
  editor: NonNullable<ReturnType<typeof useEditor>>;
}) {
  const map = {
    bold: {
      icon: Bold,
      label: "Fett (Cmd+B)",
      run: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
    },
    italic: {
      icon: Italic,
      label: "Kursiv (Cmd+I)",
      run: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
    },
    strike: {
      icon: Strikethrough,
      label: "Durchgestrichen",
      run: () => editor.chain().focus().toggleStrike().run(),
      active: editor.isActive("strike"),
    },
    h3: {
      icon: Heading3,
      label: "Zwischenüberschrift",
      run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      active: editor.isActive("heading", { level: 3 }),
    },
    bullet: {
      icon: List,
      label: "Liste",
      run: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive("bulletList"),
    },
    ordered: {
      icon: ListOrdered,
      label: "Nummerierte Liste",
      run: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive("orderedList"),
    },
    link: {
      icon: Link2,
      label: "Link",
      run: () => {
        const previous = (editor.getAttributes("link") as { href?: string }).href ?? "";
        const url = window.prompt("Link-URL", previous);
        if (url === null) return;
        if (url.trim() === "") {
          editor.chain().focus().extendMarkRange("link").unsetLink().run();
          return;
        }
        const safe = /^(https?:|mailto:|tel:)/.test(url) ? url : `https://${url}`;
        editor
          .chain()
          .focus()
          .extendMarkRange("link")
          .setLink({ href: safe })
          .run();
      },
      active: editor.isActive("link"),
    },
  } as const;

  const { icon: Icon, label, run, active } = map[kind];
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={run}
      className={cn(
        "flex size-7 items-center justify-center rounded-md transition-colors",
        active
          ? "bg-[var(--neon-violet)]/15 text-[var(--neon-violet)]"
          : "text-muted-foreground/70 hover:bg-accent/60 hover:text-foreground"
      )}
    >
      <Icon className="size-3.5" />
    </button>
  );
}
