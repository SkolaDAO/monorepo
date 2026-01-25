import * as jose from "jose";
import { env } from "./env";
import type { JWTPayload } from "../types";

const secret = new TextEncoder().encode(env.JWT_SECRET);

function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 60 * 60;
    case "d":
      return value * 24 * 60 * 60;
    default:
      return 7 * 24 * 60 * 60;
  }
}

export async function createAccessToken(userId: string, address: string): Promise<string> {
  const expiresIn = parseExpiresIn(env.JWT_EXPIRES_IN);

  return new jose.SignJWT({ address })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .sign(secret);
}

export async function createRefreshToken(): Promise<string> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}
