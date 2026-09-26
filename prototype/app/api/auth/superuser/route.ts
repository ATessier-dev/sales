import { NextResponse } from "next/server";
import { verifySuperuserCode } from "@/lib/auth/superuserCode";

// Ne fait que vérifier le code pour déverrouiller l'UI de /settings côté
// client (voir settingsGate.tsx) : chaque appel mutateur revérifie ce même
// code lui-même (header x-superuser-code), cette route n'est qu'un premier
// retour immédiat pour l'utilisateur.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code.trim() : "";

  if (!(await verifySuperuserCode(code))) {
    return NextResponse.json({ error: "invalid_code" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
