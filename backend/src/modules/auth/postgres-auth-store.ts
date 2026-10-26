import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import type { AuthStore, User } from "./auth-store.js";

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
};

function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
  };
}

export class PostgresAuthStore implements AuthStore {
  constructor(private readonly pool: Pool) {}

  async createUser(email: string, passwordHash: string): Promise<User | null> {
    try {
      const result = await this.pool.query<UserRow>(
        `INSERT INTO users(id, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, email, password_hash, created_at`,
        [randomUUID(), email, passwordHash],
      );
      return toUser(result.rows[0]!);
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
        return null;
      }
      throw error;
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query<UserRow>(
      "SELECT id, email, password_hash, created_at FROM users WHERE email = $1",
      [email],
    );
    return result.rows[0] ? toUser(result.rows[0]) : null;
  }

  async createSession(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.pool.query(
      "INSERT INTO sessions(token_hash, user_id, expires_at) VALUES ($1, $2, $3)",
      [tokenHash, userId, expiresAt],
    );
  }

  async findUserBySession(tokenHash: string, now: Date): Promise<User | null> {
    const result = await this.pool.query<UserRow>(
      `SELECT u.id, u.email, u.password_hash, u.created_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > $2`,
      [tokenHash, now],
    );
    return result.rows[0] ? toUser(result.rows[0]) : null;
  }

  async deleteSession(tokenHash: string): Promise<void> {
    await this.pool.query("DELETE FROM sessions WHERE token_hash = $1", [tokenHash]);
  }

  async healthcheck(): Promise<void> {
    await this.pool.query("SELECT 1");
  }
}
