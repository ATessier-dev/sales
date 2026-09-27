import { getLocale } from "next-intl/server";
import { ShoppingCart, Menu } from "lucide-react";
import { NavBar, NavBarBrand, NavBarLinks } from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";
import { getTranslation, navbarTranslations, type Language } from "@/translations";
import { LanguageSwitcher } from "./languageSwitcher";
import { NavLink } from "./navLink";

// Pas de session : tous les liens sont toujours visibles, y compris
// /settings qui demande son propre code au moment d'y accéder (voir
// settingsGate.tsx) plutôt que d'être caché selon un rôle.
const navItems = [
  { href: "/pos", key: "pos" },
  { href: "/items", key: "items" },
  { href: "/sales", key: "sales" },
  { href: "/reports", key: "reports" },
  { href: "/sellers", key: "sellers" },
  { href: "/settings", key: "settings" },
] as const;

export default async function Navbar() {
  const locale = await getLocale();
  const language = locale as Language;

  return (
    <NavBar>
      <NavBarBrand className="flex items-center gap-2">
        <ShoppingCart className="h-5 w-5 text-primary" aria-hidden="true" />
        <span>{getTranslation(navbarTranslations.brand, language)}</span>
      </NavBarBrand>

      <NavBarLinks className="hidden sm:flex">
        {navItems.map(({ href, key }) => (
          <NavLink key={href} href={href}>
            {getTranslation(navbarTranslations[key], language)}
          </NavLink>
        ))}
      </NavBarLinks>

      <div className="flex items-center gap-3">
        <LanguageSwitcher language={language} />

        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Menu">
                <Menu className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {navItems.map(({ href, key }) => (
                <DropdownMenuItem key={href} asChild>
                  <Link href={href}>{getTranslation(navbarTranslations[key], language)}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </NavBar>
  );
}
