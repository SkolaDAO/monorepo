import type { Context } from "hono";
import type { Database } from "../db";

export interface AuthUser {
  id: string;
  address: string;
  isCreator: boolean;
  isAdmin: boolean;
  creatorTier: "starter" | "pro" | "elite" | null;
}

export interface AppVariables {
  user: AuthUser;
  db: Database;
}

export type AppContext = Context<{ Variables: AppVariables }>;

export interface JWTPayload {
  sub: string;
  address: string;
  iat: number;
  exp: number;
}

export interface SIWESession {
  nonce: string;
  expiresAt: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
