export type MockSession = {
  id: string;
  title: string;
  client?: string;
  status: "draft" | "scheduled" | "running" | "completed";
  durationMinutes: number;
  startTime: string;
  endTime: string;
  blockCount: number;
  date?: string;
  tags: string[];
  updatedAt: string;
};

export const MOCK_SESSIONS: MockSession[] = [
  {
    id: "demo-1",
    title: "Galliker Mission & Values",
    client: "Galliker Transport AG",
    status: "scheduled",
    durationMinutes: 130,
    startTime: "08:00",
    endTime: "10:10",
    blockCount: 13,
    date: "2026-05-12",
    tags: ["Workshop", "Workplace Culture", "Leadership"],
    updatedAt: "vor 1 Stunde",
  },
  {
    id: "demo-2",
    title: "Q2 Strategy Offsite",
    client: "hellopure",
    status: "draft",
    durationMinutes: 480,
    startTime: "09:00",
    endTime: "17:00",
    blockCount: 24,
    date: "2026-06-04",
    tags: ["Strategy", "Offsite"],
    updatedAt: "gestern",
  },
  {
    id: "demo-3",
    title: "Design Sprint Kickoff",
    client: "Acme Inc.",
    status: "completed",
    durationMinutes: 240,
    startTime: "13:00",
    endTime: "17:00",
    blockCount: 9,
    date: "2026-04-22",
    tags: ["Design", "Idea Generation"],
    updatedAt: "vor einer Woche",
  },
];

export const STATUS_LABEL: Record<MockSession["status"], string> = {
  draft: "Entwurf",
  scheduled: "Geplant",
  running: "Läuft",
  completed: "Abgeschlossen",
};

export function getMockSession(id: string): MockSession | null {
  return MOCK_SESSIONS.find((s) => s.id === id) ?? null;
}
