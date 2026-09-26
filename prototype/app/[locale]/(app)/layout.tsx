import type { ReactNode } from "react";
import Navbar from "./navbar";

// Plus de session : l'app est accessible sans connexion, seul /settings
// demande son propre code (voir settingsGate.tsx) au moment d'y accéder.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
