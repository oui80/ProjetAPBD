import { randomUUID } from "node:crypto";
import type { AuthStore, User } from "../src/modules/auth/auth-store.js";
import type {
  ActivityImport,
  ActivityStore,
  ActivitySummary,
} from "../src/modules/activities/activity-store.js";

export class MemoryAuthStore implements AuthStore, ActivityStore {
  private readonly users = new Map<string, User>();
  private readonly sessions = new Map<string, { userId: string; expiresAt: Date }>();
  private readonly activities: ActivityImport[] = [];

  async createUser(email: string, passwordHash: string): Promise<User | null> {
    if (this.users.has(email)) return null;
    const user = { id: randomUUID(), email, passwordHash, createdAt: new Date() };
    this.users.set(email, user);
    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.users.get(email) ?? null;
  }

  async createSession(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    this.sessions.set(tokenHash, { userId, expiresAt });
  }

  async findUserBySession(tokenHash: string, now: Date): Promise<User | null> {
    const session = this.sessions.get(tokenHash);
    if (!session || session.expiresAt <= now) return null;
    return [...this.users.values()].find((user) => user.id === session.userId) ?? null;
  }

  async deleteSession(tokenHash: string): Promise<void> {
    this.sessions.delete(tokenHash);
  }

  async healthcheck(): Promise<void> {}

  async listActivities(userId: string): Promise<ActivitySummary[]> {
    return this.activities.filter((activity) => activity.userId === userId);
  }

  async createActivity(activity: ActivityImport): Promise<boolean> {
    const duplicate = this.activities.some(
      (existing) => existing.userId === activity.userId && existing.sha256 === activity.sha256,
    );
    if (duplicate) return false;
    this.activities.push(activity);
    return true;
  }
}
