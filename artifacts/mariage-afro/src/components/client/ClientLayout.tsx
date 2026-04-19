import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useUser, useClerk } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, Wallet, Users, ListChecks, Briefcase, FileText, Sparkles,
  LogOut, Menu, X, Heart,
} from "lucide-react";
import { clientApi } from "@/lib/clientApi";

interface Couple {
  id: number;
  partner1Name: string;
  partner2Name: string;
  weddingDate: string | null;
}

const NAV = [
  { to: "/espace-client", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { to: "/espace-client/budget", label: "Budget", icon: Wallet },
  { to: "/espace-client/invites", label: "Invités", icon: Users },
  { to: "/espace-client/planning", label: "Planning", icon: ListChecks },
  { to: "/espace-client/prestataires", label: "Prestataires", icon: Briefcase },
  { to: "/espace-client/documents", label: "Documents", icon: FileText },
  { to: "/espace-client/jour-j", label: "Jour J", icon: Sparkles },
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
      {/* Sidebar — desktop */}
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
                {item.label}
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
          Se déconnecter
        </button>
      </aside>

      {/* Top bar — mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-neutral-200 h-16 flex items-center justify-between px-4">
        <Link to="/" className="text-primary font-bold tracking-widest text-xs uppercase">Mariage Afro</Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu" className="p-2">
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
                  <Icon className="w-5 h-5" /> {item.label}
                </Link>
              );
            })}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-6 py-4 text-base text-neutral-600 w-full text-left border-t mt-2"
            >
              <LogOut className="w-5 h-5" /> Se déconnecter
            </button>
          </nav>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-6 lg:px-10 py-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-widest text-neutral-500">Bonjour 👋</p>
            <h1 className="font-bold text-xl lg:text-2xl text-neutral-900">
              {firstName || "Bienvenue"}{partnerName ? ` & ${partnerName}` : ""}
            </h1>
          </div>
          {days !== null && (
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-neutral-500">Compte à rebours</p>
              <p className="text-2xl lg:text-3xl font-bold text-primary" data-testid="text-countdown">
                {days >= 0 ? `J-${days}` : `J+${Math.abs(days)}`}
              </p>
            </div>
          )}
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-10 py-8">{children ?? <Outlet />}</main>
    </div>
  );
}
