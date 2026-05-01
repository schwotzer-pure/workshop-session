export type AppUserRole = "ADMIN" | "TRAINER";

export type AppUser = {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
  role: AppUserRole;
  avatarUrl?: string;
  /** Organization the user belongs to. Null = no org (rare). */
  organizationId: string | null;
};

export const DUMMY_USERS: AppUser[] = [
  {
    id: "user_admin",
    username: "admin",
    password: "admin",
    name: "Admin",
    email: "admin@hellopure.io",
    role: "ADMIN",
    organizationId: "org_pure",
  },
  {
    id: "user_trainer",
    username: "user",
    password: "user",
    name: "Trainer",
    email: "trainer@hellopure.io",
    role: "TRAINER",
    organizationId: "org_pure",
  },
  {
    id: "user_yannic",
    username: "yannic",
    password: "gold",
    name: "Yannic",
    email: "yannic@goldinteractive.ch",
    role: "TRAINER",
    organizationId: "org_gold",
  },
  {
    id: "user_marco",
    username: "marco",
    password: "neustadt",
    name: "Marco",
    email: "marco@neustadt.swiss",
    role: "TRAINER",
    organizationId: "org_neustadt",
  },
  {
    id: "user_tamara",
    username: "tamara",
    password: "neustadt",
    name: "Tamara",
    email: "tamara@neustadt.swiss",
    role: "TRAINER",
    organizationId: "org_neustadt",
  },
];

export function findUserByCredentials(username: string, password: string): AppUser | null {
  const u = DUMMY_USERS.find((x) => x.username === username);
  if (!u) return null;
  if (u.password !== password) return null;
  return u;
}
