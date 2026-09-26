import { type Language } from "@/translations";
import { SettingsGate } from "./settingsGate";

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const language = (locale === "en" ? "en" : "fr") as Language;

  return <SettingsGate language={language} />;
}
