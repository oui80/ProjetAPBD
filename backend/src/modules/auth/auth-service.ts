import { createHash, randomBytes } from "node:crypto";
import argon2 from "argon2";
import type { AuthStore, PublicUser, User } from "./auth-store.js";

export type AuthResult = {
  user: PublicUser;
  token: string;
  expiresAt: Date;
};

export class InvalidCredentialsError extends Error {}
export class EmailAlreadyUsedError extends Error {}

function publicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export class AuthService {
  private argon2Queue = Promise.resolve();
  private readonly dummyHash = this.runArgon2(() =>
    argon2.hash("pace-lab-nonexistent-user", { type: argon2.argon2id }),
  );

  constructor(
    private readonly store: AuthStore,
    private readonly sessionTtlMs: number,
  ) {}

  async register(email: string, password: string): Promise<AuthResult> {
    const passwordHash = await this.runArgon2(() =>
      argon2.hash(password, { type: argon2.argon2id }),
    );
    const user = await this.store.createUser(email, passwordHash);
    if (!user) throw new EmailAlreadyUsedError();
    return this.createSession(user);
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.store.findUserByEmail(email);
    const passwordHash = user?.passwordHash ?? (await this.dummyHash);
    const matches = await this.runArgon2(() => argon2.verify(passwordHash, password));

    if (!user || !matches) throw new InvalidCredentialsError();
    return this.createSession(user);
  }

  async session(token: string): Promise<PublicUser | null> {
    const user = await this.store.findUserBySession(hashSessionToken(token), new Date());
    return user ? publicUser(user) : null;
  }

  async logout(token: string): Promise<void> {
    await this.store.deleteSession(hashSessionToken(token));
  }

  private async createSession(user: User): Promise<AuthResult> {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + this.sessionTtlMs);
    await this.store.createSession(user.id, hashSessionToken(token), expiresAt);
    return { user: publicUser(user), token, expiresAt };
  }

  private runArgon2<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.argon2Queue.then(operation, operation);
    this.argon2Queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
}
