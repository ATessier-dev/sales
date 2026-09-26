"use client";

import { createContext, useContext } from "react";

// Le code n'est jamais persisté (pas de cookie, pas de localStorage) : il ne
// vit que dans cet état React, donc disparaît dès que l'utilisateur quitte
// /settings ou recharge la page, comme demandé.
const SuperuserCodeContext = createContext<string | null>(null);

export const SuperuserCodeProvider = SuperuserCodeContext.Provider;

export function useSuperuserCode(): string {
  const code = useContext(SuperuserCodeContext);
  if (code === null) {
    throw new Error("useSuperuserCode must be used within a SuperuserCodeProvider");
  }
  return code;
}

/** fetch() qui attache toujours le code superuser courant en header. */
export function useSuperuserFetch(): (url: string, init?: RequestInit) => Promise<Response> {
  const code = useSuperuserCode();
  return (url, init = {}) =>
    fetch(url, { ...init, headers: { ...init.headers, "x-superuser-code": code } });
}
