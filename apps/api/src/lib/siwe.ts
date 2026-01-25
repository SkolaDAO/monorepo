import { SiweMessage, generateNonce } from "siwe";

const nonceStore = new Map<string, { nonce: string; expiresAt: Date }>();

const NONCE_TTL_MS = 5 * 60 * 1000;

export function createNonce(): string {
  const nonce = generateNonce();
  nonceStore.set(nonce, {
    nonce,
    expiresAt: new Date(Date.now() + NONCE_TTL_MS),
  });
  return nonce;
}

export function validateNonce(nonce: string): boolean {
  const stored = nonceStore.get(nonce);
  if (!stored) return false;

  if (stored.expiresAt < new Date()) {
    nonceStore.delete(nonce);
    return false;
  }

  nonceStore.delete(nonce);
  return true;
}

export async function verifySiweMessage(
  message: string,
  signature: string
): Promise<{ address: string; chainId: number } | null> {
  try {
    const siweMessage = new SiweMessage(message);
    const result = await siweMessage.verify({ signature });

    if (!result.success) return null;
    if (!validateNonce(siweMessage.nonce)) return null;

    return {
      address: siweMessage.address,
      chainId: siweMessage.chainId,
    };
  } catch {
    return null;
  }
}

setInterval(() => {
  const now = new Date();
  for (const [key, value] of nonceStore.entries()) {
    if (value.expiresAt < now) {
      nonceStore.delete(key);
    }
  }
}, 60 * 1000);
