import { randomUUID } from "node:crypto";
import type { AuthStore, User } from "../src/modules/auth/auth-store.js";
import type {
  ActivityImport,
  ActivityDetail,
  ActivityListQuery,
  ActivityListResult,
  ActivityStore,
  ActivitySummary,
  TrainingActivity,
} from "../src/modules/activities/activity-store.js";

export class MemoryAuthStore implements AuthStore, ActivityStore {
  private readonly users = new Map<string, User>();
  private readonly sessions = new Map<string, { userId: string; expiresAt: Date }>();
  private readonly activities: ActivityImport[] = [];
  private readonly maxHeartRates = new Map<string, number | null>();

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

  async listActivities(userId: string, query: ActivityListQuery): Promise<ActivityListResult> {
    const filtered = this.activities
      .filter((activity) => activity.userId === userId)
      .filter((activity) => !query.search || activity.filename.toLowerCase().includes(query.search.toLowerCase()))
      .filter((activity) => {
        if (!query.sport) return true;
        const isTrail = activity.sport?.includes("trail") || activity.subSport?.includes("trail");
        if (query.sport === "trail") return isTrail;
        if (query.sport === "running") return activity.sport === "running" && !isTrail;
        return activity.sport === query.sport;
      })
      .sort((left, right) => {
        const difference = (left.startTime?.getTime() ?? 0) - (right.startTime?.getTime() ?? 0);
        return query.sort === "asc" ? difference : -difference;
      });
    const start = (query.page - 1) * query.pageSize;
    return {
      activities: filtered.slice(start, start + query.pageSize),
      total: filtered.length,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async listActivitiesForDashboard(userId: string, since: Date | null): Promise<ActivitySummary[]> {
    return this.activities.filter(
      (activity) =>
        activity.userId === userId &&
        (!since || (activity.startTime !== null && activity.startTime >= since)),
    );
  }

  async listTrainingActivities(userId: string): Promise<TrainingActivity[]> {
    return this.activities
      .filter((activity) => activity.userId === userId && activity.startTime !== null)
      .map((activity) => ({
        id: activity.id,
        startTime: activity.startTime!,
        samples: activity.samples,
      }));
  }

  async getActivity(userId: string, activityId: string): Promise<ActivityDetail | null> {
    const activity = this.activities.find(
      (value) => value.userId === userId && value.id === activityId,
    );
    if (!activity) return null;
    const { userId: _userId, sha256: _sha256, ...detail } = activity;
    void _userId;
    void _sha256;
    return detail;
  }

  async getMaxHeartRate(userId: string): Promise<number | null> {
    return this.maxHeartRates.get(userId) ?? null;
  }

  async setMaxHeartRate(userId: string, maxHeartRate: number | null): Promise<void> {
    this.maxHeartRates.set(userId, maxHeartRate);
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
