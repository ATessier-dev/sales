import * as argon2 from "argon2";

// Same hash/verify shape as clockin's lib/auth-utils.ts.

export async function hashCode(code: string): Promise<string> {
  return argon2.hash(code);
}

export async function verifyCode(code: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, code);
  } catch (error) {
    console.error("[auth] argon2 verification failed:", error);
    return false;
  }
}
