/**
 * Public layout for tokenized share links.
 * — No sidebar / no auth check
 * — Inherits root <html><body>
 * — Aurora background for visual continuity with the brand
 */
export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="aurora-bg flex min-h-screen flex-col"
      suppressHydrationWarning
    >
      {children}
    </div>
  );
}

export const metadata = {
  title: "Workshop-Vorschau — Sessions",
  // Discourage indexing: shared links should not appear in search results
  robots: { index: false, follow: false },
};
