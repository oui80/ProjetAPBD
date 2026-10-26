export type User = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
};

export type PublicUser = Omit<User, "passwordHash">;

export interface AuthStore {
  createUser(email: string, passwordHash: string): Promise<User | null>;
  findUserByEmail(email: string): Promise<User | null>;
  createSession(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  findUserBySession(tokenHash: string, now: Date): Promise<User | null>;
  deleteSession(tokenHash: string): Promise<void>;
  healthcheck(): Promise<void>;
}
