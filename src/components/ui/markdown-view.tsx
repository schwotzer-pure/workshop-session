"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Render a Markdown string as React nodes with Tailwind-typography-like
 * styling that matches Aurora. Safe by default (no raw HTML allowed).
 */
export function MarkdownView({
  children,
  className,
  compact = false,
}: {
  children: string | null | undefined;
  className?: string;
  /** Compact = tighter spacing for header/summary contexts. */
  compact?: boolean;
}) {
  if (!children?.trim()) return null;

  return (
    <div
      className={cn(
        "tiptap-prose text-sm",
        compact ? "tiptap-prose-compact" : "",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children: linkChildren }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-[var(--neon-violet)] underline underline-offset-2 hover:text-[var(--neon-pink)]"
            >
              {linkChildren}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
