import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useUser, useClerk } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard, Briefcase, Image as ImageIcon, ListChecks,
  Settings, LogOut, Menu, X, Heart, AlertCircle, CheckCircle2,
  CalendarDays, Inbox,
} from "lucide-react";
import { vendorApi } from "@/lib/vendorApi";
import VendorOnboardingGate from "@/components/vendor/VendorOnboardingGate";

interface VendorAccount {
  id: number;
  userId: string;
  vendorId: number | null;
  businessName: string;
  contactName: string;
  email: string;
  phone: string | null;
  category: string;
  city: string;
  status: string;
  onboardedAt: string | null;
}

interface VendorProfile {
  id: number;
  name: string;
  verified: boolean;
  active: boolean;
}

interface MeResponse {
  account: VendorAccount;
  vendor: VendorProfile | null;
}

export function useVendorMe() {
  return useQuery<MeResponse>({
    queryKey: ["vendor", "me"],
    queryFn: () => vendorApi.get<MeResponse>("/api/vendor/me"),
  });
}

export function useVendorUnseenLeadsCount() {
  return useQuery<{ count: number }>({
    queryKey: ["vendor", "leads", "unseen"],
    queryFn: () => vendorApi.get<{ count: number }>("/api/vendor/leads/unseen-count"),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

export default function VendorLayout({ children }: { children?: ReactNode }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data } = useVendorMe();
  const { data: unseen } = useVendorUnseenLeadsCount();

  const account = data?.account;
  const vendor = data?.vendor;
  const unseenCount = unseen?.count ?? 0;

  const NAV = [
    { to: "/espace-pro", label: t("vendor.nav.dashboard"), icon: LayoutDashboard, exact: true, badge: 0 },
    { to: "/espace-pro/leads", label: t("vendor.nav.leads"), icon: Inbox, badge: unseenCount },
    { to: "/espace-pro/profile", label: t("vendor.nav.profile"), icon: Briefcase, badge: 0 },
    { to: "/espace-pro/gallery", label: t("vendor.nav.gallery"), icon: ImageIcon, badge: 0 },
    { to: "/espace-pro/services", label: t("vendor.nav.services"), icon: ListChecks, badge: 0 },
    { to: "/espace-pro/agenda", label: t("vendor.nav.agenda"), icon: CalendarDays, badge: 0 },
    { to: "/espace-pro/settings", label: t("vendor.nav.settings"), icon: Settings, badge: 0 },
  ];

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const businessName = account?.businessName || user?.firstName || "—";

  return (
    <div className="min-h-screen bg-cream pt-16 lg:pt-0 lg:pl-64">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 bg-wine-deep border-r border-gold/20 flex-col z-30">
        <div className="px-6 py-6 border-b border-gold/20">
          <Link to="/" className="flex items-center gap-2 text-gold font-bold tracking-widest text-sm uppercase">
            <Heart className="w-4 h-4 fill-gold" />
            <span className="text-cream">Mariage Afro</span>
          </Link>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold/70 mt-2">{t("vendor.layout.pro_space")}</p>
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
                  active
                    ? "border-gold bg-wine-deep/60 text-gold"
                    : "border-transparent text-cream/80 hover:bg-wine-deep/60 hover:text-gold"
                }`}
                data-testid={`link-vendor-${item.to.split("/").pop()}`}
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1">{item.label}</span>
                {item.badge > 0 && (
                  <span
                    className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[10px] font-bold rounded-full bg-gold text-wine-deep"
                    data-testid="badge-vendor-leads"
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-6 py-4 text-sm font-medium text-cream/70 hover:text-gold border-t border-gold/20"
          data-testid="button-vendor-signout"
        >
          <LogOut className="w-4 h-4" />
          {t("vendor.layout.signout")}
        </button>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-wine-deep border-b border-gold/20 h-16 flex items-center justify-between px-4">
        <Link to="/" className="text-gold font-bold tracking-widest text-xs uppercase">Mariage Afro Pro</Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu" className="p-2 text-cream">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed top-16 left-0 right-0 bottom-0 bg-wine-deep z-30 overflow-y-auto">
          <nav className="py-4">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to, item.exact);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-6 py-4 text-base font-medium ${
                    active ? "text-gold bg-wine-deep/60" : "text-cream/80"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[10px] font-bold rounded-full bg-gold text-wine-deep">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-6 py-4 text-base text-cream/70 w-full text-left border-t border-gold/20 mt-2"
            >
              <LogOut className="w-5 h-5" /> {t("vendor.layout.signout")}
            </button>
          </nav>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-6 lg:px-10 py-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-widest text-neutral-500">{t("vendor.layout.welcome")}</p>
            <h1 className="font-bold text-xl lg:text-2xl text-wine-deep" data-testid="text-vendor-name">
              {businessName}
            </h1>
          </div>
          {vendor && (
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest" data-testid="badge-vendor-status">
              {vendor.verified && vendor.active ? (
                <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {t("vendor.layout.status_published")}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-3 py-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> {t("vendor.layout.status_pending")}
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-10 py-8">
        <VendorOnboardingGate account={account}>
          {children ?? <Outlet />}
        </VendorOnboardingGate>
      </main>
    </div>
  );
}
