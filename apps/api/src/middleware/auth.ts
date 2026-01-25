import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm";
import { verifyAccessToken } from "../lib/jwt";
import { db } from "../db";
import { users } from "../db/schema";
import type { AppVariables } from "../types";

export const authMiddleware = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new HTTPException(401, { message: "Missing authorization header" });
  }

  const token = authHeader.slice(7);
  const payload = await verifyAccessToken(token);

  if (!payload) {
    throw new HTTPException(401, { message: "Invalid or expired token" });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, payload.sub),
  });

  if (!user) {
    throw new HTTPException(401, { message: "User not found" });
  }

  if (user.isBanned) {
    throw new HTTPException(403, { message: "Your account has been suspended" });
  }

  c.set("user", {
    id: user.id,
    address: user.address,
    isCreator: user.isCreator,
    isAdmin: user.isAdmin,
    creatorTier: user.creatorTier,
  });

  await next();
});

export const optionalAuthMiddleware = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = await verifyAccessToken(token);

    if (payload) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, payload.sub),
      });

      if (user && !user.isBanned) {
        c.set("user", {
          id: user.id,
          address: user.address,
          isCreator: user.isCreator,
          isAdmin: user.isAdmin,
          creatorTier: user.creatorTier,
        });
      }
    }
  }

  await next();
});

export const creatorMiddleware = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const user = c.get("user");

  if (!user?.isCreator) {
    throw new HTTPException(403, { message: "Creator access required" });
  }

  await next();
});

export const adminMiddleware = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const user = c.get("user");

  if (!user?.isAdmin) {
    throw new HTTPException(403, { message: "Admin access required" });
  }

  await next();
});
