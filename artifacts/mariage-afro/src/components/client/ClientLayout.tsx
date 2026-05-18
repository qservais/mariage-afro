import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useUser, useClerk } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard, Wallet, Users, ListChecks, Briefcase, FileText, Sparkles,
  LogOut, Menu, X, Heart, UserCircle, MessageCircle, Globe, Armchair, Image as ImageIcon, Gift, Receipt,
} from "lucide-react";
import { clientApi } from "@/lib/clientApi";
import OnboardingGate from "@/components/client/OnboardingGate";

interface Couple {
  id: number;
  partner1Name: string;
  partner2Name: string;
  weddingDate: string | null;
  budget: number | null;
  budgetMode: "libre" | "global";
  status: string;
  onboardedAt: string | null;
  validatedAt: string | null;
}

interface NavItem {
  to: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}

const NAV: NavItem[] = [
  { to: "/espace-client", labelKey: "client_layout.nav.dashboard", icon: LayoutDashboard, exact: true },
  { to: "/espace-client/budget", labelKey: "client_layout.nav.budget", icon: Wallet },
  { to: "/espace-client/invites", labelKey: "client_layout.nav.invites", icon: Users },
  { to: "/espace-client/plan-de-table", labelKey: "client_layout.nav.seating", icon: Armchair },
  { to: "/espace-client/planning", labelKey: "client_layout.nav.planning", icon: ListChecks },
  { to: "/espace-client/prestataires", labelKey: "client_layout.nav.vendors", icon: Briefcase },
  { to: "/espace-client/documents", labelKey: "client_layout.nav.documents", icon: FileText },
  { to: "/espace-client/jour-j", labelKey: "client_layout.nav.day", icon: Sparkles },
  { to: "/espace-client/communication", labelKey: "client_layout.nav.communication", icon: MessageCircle },
  { to: "/espace-client/site", labelKey: "client_layout.nav.site", icon: Globe },
  { to: "/espace-client/inspiration", labelKey: "client_layout.nav.inspiration", icon: ImageIcon },
  { to: "/espace-client/cagnotte", labelKey: "client_layout.nav.cagnotte", icon: Gift },
  { to: "/espace-client/devis", labelKey: "client_layout.nav.devis", icon: Receipt },
  { to: "/espace-client/profil", labelKey: "client_layout.nav.profile", icon: UserCircle },
];

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const ms = target.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function useCouple() {
  return useQuery<Couple>({
    queryKey: ["client", "me"],
    queryFn: () => clientApi.get<Couple>("/api/client/me"),
  });
}

export default function ClientLayout({ children }: { children?: ReactNode }) {
  const { t } = useTranslation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: couple } = useCouple();

  const days = daysUntil(couple?.weddingDate);
  const firstName = couple?.partner1Name || user?.firstName || "";
  const partnerName = couple?.partner2Name || "";

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background pt-16 lg:pt-0 lg:pl-64">
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-neutral-200 flex-col z-30">
        <div className="px-6 py-6 border-b border-neutral-200">
          <Link to="/" className="flex items-center gap-2 text-primary font-bold tracking-widest text-sm uppercase">
            <Heart className="w-4 h-4 fill-primary" />
            Mariage Afro
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to, item.exact);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-6 py-3 text-sm font-medium border-l-2 transition-colors ${
                  active ? "border-primary bg-background text-primary" : "border-transparent text-neutral-700 hover:bg-background/40"
                }`}
                data-testid={`link-client-${item.to.split("/").pop()}`}
              >
                <Icon className="w-4 h-4" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-6 py-4 text-sm font-medium text-neutral-600 hover:text-primary border-t border-neutral-200"
          data-testid="button-signout"
        >
          <LogOut className="w-4 h-4" />
          {t("client_layout.signout")}
        </button>
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-neutral-200 h-16 flex items-center justify-between px-4">
        <Link to="/" className="text-primary font-bold tracking-widest text-xs uppercase">Mariage Afro</Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} aria-label={t("client_layout.menu_aria")} className="p-2">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed top-16 left-0 right-0 bottom-0 bg-white z-30 overflow-y-auto">
          <nav className="py-4">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to, item.exact);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-6 py-4 text-base font-medium ${active ? "text-primary bg-background" : "text-neutral-700"}`}
                >
                  <Icon className="w-5 h-5" /> {t(item.labelKey)}
                </Link>
              );
            })}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-6 py-4 text-base text-neutral-600 w-full text-left border-t mt-2"
            >
              <LogOut className="w-5 h-5" /> {t("client_layout.signout")}
            </button>
          </nav>
        </div>
      )}

      <header className="bg-white border-b border-neutral-200 px-6 lg:px-10 py-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-widest text-neutral-500">{t("client_layout.hello")}</p>
            <h1 className="font-bold text-xl lg:text-2xl text-neutral-900">
              {firstName || t("client_layout.welcome_fallback")}{partnerName ? ` & ${partnerName}` : ""}
            </h1>
          </div>
          {days !== null && (
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-neutral-500">{t("client_layout.countdown_label")}</p>
              <p className="text-2xl lg:text-3xl font-bold text-primary" data-testid="text-countdown">
                {days >= 0 ? `J-${days}` : `J+${Math.abs(days)}`}
              </p>
            </div>
          )}
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-10 py-8">
        <OnboardingGate couple={couple}>{children ?? <Outlet />}</OnboardingGate>
      </main>
    </div>
  );
}
