import { verifyCode } from "@/lib/auth-utils";

// Code de développement local par défaut ("SUPER001", même convention que
// les codes de seed EMP001/SUP001 déjà utilisés) : évite d'imposer une
// variable d'environnement en dev, tout en restant hashé (argon2) plutôt
// qu'en clair dans le code.
const LOCAL_DEV_SUPERUSER_CODE_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$757phWsHmndGJCCzftlnxg$p+zDQmzI/aVcA9lKyDIU8PeiUzkASDV1aEy3IqeP6ZE";

export const SUPERUSER_CODE_HEADER = "x-superuser-code";

function getSuperuserCodeHash(): string {
  const hash = process.env.SUPERUSER_CODE_HASH;
  if (hash) return hash;

  if (process.env.NODE_ENV === "production") {
    throw new Error("SUPERUSER_CODE_HASH environment variable is not defined");
  }

  return LOCAL_DEV_SUPERUSER_CODE_HASH;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super("Forbidden");
    this.name = "ForbiddenError";
  }
}

export async function verifySuperuserCode(code: string): Promise<boolean> {
  if (!code) return false;
  return verifyCode(code, getSuperuserCodeHash());
}

/// Aucune session : chaque requête porte son propre code (header
/// x-superuser-code), revérifié à chaque appel plutôt que mémorisé côté
/// serveur — voir settingsGate.tsx pour pourquoi (le code n'est gardé que
/// tant que l'utilisateur reste sur la page).
export async function requireSuperuserCode(request: Request): Promise<void> {
  const code = request.headers.get(SUPERUSER_CODE_HEADER) ?? "";
  if (!code) throw new UnauthorizedError();
  if (!(await verifySuperuserCode(code))) throw new ForbiddenError();
}
