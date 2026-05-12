import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import i18n, { SUPPORTED_LANGS, type SupportedLang } from "@/i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Show } from "@clerk/react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { StickyCTA } from "@/components/StickyCTA";
import { MariageAfroClerkProvider } from "@/lib/clerk";
import "./i18n";

// Public routes — code-split (only home stays eager for fast LCP)
const Services = lazy(() => import("@/pages/services"));
const Plateforme = lazy(() => import("@/pages/plateforme"));
const Partenaires = lazy(() => import("@/pages/prestations"));
const PartenaireDetail = lazy(() => import("@/pages/prestataires-detail"));
const Lieux = lazy(() => import("@/pages/lieux"));
const Comparateur = lazy(() => import("@/pages/comparateur"));
const Shop = lazy(() => import("@/pages/shop"));
const Realisations = lazy(() => import("@/pages/realisations"));
const About = lazy(() => import("@/pages/about"));
const Contact = lazy(() => import("@/pages/contact"));
const OutilsBudget = lazy(() => import("@/pages/outils-budget"));
const OutilsQuiz = lazy(() => import("@/pages/outils-quiz"));
const GuidePage = lazy(() => import("@/pages/guide"));
const GuideInternePage = lazy(() => import("@/pages/guide-interne"));
const MentionsLegalesPage = lazy(() => import("@/pages/legal/mentions-legales"));
const ConfidentialitePage = lazy(() => import("@/pages/legal/confidentialite"));
const CookiesPage = lazy(() => import("@/pages/legal/cookies"));

// Dev-only: forms kit demo (mounted only in development build)
const FormsKitDemo = import.meta.env.DEV
  ? lazy(() => import("@/pages/_dev/FormsKitDemo"))
  : null;

// Auth & Espace Client (lazy — never loaded for anonymous public visitors)
const SignInPage = lazy(() => import("@/pages/sign-in"));
const SignUpPage = lazy(() => import("@/pages/sign-up"));
const ClientLayout = lazy(() => import("@/components/client/ClientLayout"));
const ClientDashboard = lazy(() => import("@/pages/client/dashboard"));
const BudgetPage = lazy(() => import("@/pages/client/budget"));
const GuestsPage = lazy(() => import("@/pages/client/invites"));
const SeatingPage = lazy(() => import("@/pages/client/seating"));
const PlanningPage = lazy(() => import("@/pages/client/planning"));
const VendorsPage = lazy(() => import("@/pages/client/prestataires"));
const DocumentsPage = lazy(() => import("@/pages/client/documents"));
const JourJPage = lazy(() => import("@/pages/client/jour-j"));
const ProfilPage = lazy(() => import("@/pages/client/profil"));
const CommunicationPage = lazy(() => import("@/pages/client/communication"));
const SiteMariagePage = lazy(() => import("@/pages/client/site-mariage"));
const InspirationPage = lazy(() => import("@/pages/client/inspiration"));
const CagnottePage = lazy(() => import("@/pages/client/cagnotte"));
const ClientDevisPage = lazy(() => import("@/pages/client/devis"));

// Public wedding pages (lazy — only loaded when visiting /mariage/:slug)
const MariagePublicPage = lazy(() => import("@/pages/mariage-public"));
const MariageRsvpPage = lazy(() => import("@/pages/mariage-rsvp"));
const MariageCagnottePage = lazy(() => import("@/pages/mariage-cagnotte"));
const MariageJourJPage = lazy(() => import("@/pages/mariage-jour-j"));
const MoodBoardSharedPage = lazy(() => import("@/pages/mood-board-shared"));

// Espace Pro (lazy — never loaded for couples or anonymous)
const VendorLayout = lazy(() => import("@/components/vendor/VendorLayout"));
const VendorDashboard = lazy(() => import("@/pages/vendor/dashboard"));
const VendorProfilePage = lazy(() => import("@/pages/vendor/profile"));
const VendorGalleryPage = lazy(() => import("@/pages/vendor/gallery"));
const VendorServicesPage = lazy(() => import("@/pages/vendor/services"));
const VendorSettingsPage = lazy(() => import("@/pages/vendor/settings"));
const VendorAvailabilityPage = lazy(() => import("@/pages/vendor/availability"));
const VendorLeadsPage = lazy(() => import("@/pages/vendor/leads"));
const VendorQuotesPage = lazy(() => import("@/pages/vendor/quotes"));
const VendorMessagesPage = lazy(() => import("@/pages/vendor/messages"));
const VendorAbonnementPage = lazy(() => import("@/pages/vendor/abonnement"));
const VendorSignInPage = lazy(() => import("@/pages/vendor/sign-in"));
const VendorSignUpPage = lazy(() => import("@/pages/vendor/sign-up"));

const queryClient = new QueryClient();

function RouteFallback() {
  return (
    <div
      className="min-h-[40vh] flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="Chargement"
    >
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="sr-only">Chargement…</span>
    </div>
  );
}

function ProtectedClient({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out"><Navigate to="/espace-client/login" replace /></Show>
    </>
  );
}

function ProtectedVendor({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out"><Navigate to="/espace-pro/login" replace /></Show>
    </>
  );
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:rounded-sm focus:outline focus:outline-2 focus:outline-gold"
      >
        Aller au contenu principal
      </a>
      <Header />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer />
      <ExitIntentPopup />
      <StickyCTA />
    </div>
  );
}

function LangUrlSync({ children }: { children: React.ReactNode }) {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const segs = pathname.split("/").filter(Boolean);
    const first = segs[0];
    if (first && first.length === 2 && (SUPPORTED_LANGS as readonly string[]).includes(first)) {
      const lang = first as SupportedLang;
      if (i18n.language !== lang) i18n.changeLanguage(lang);
      const rest = "/" + segs.slice(1).join("/");
      const params = new URLSearchParams(search);
      params.set("lang", lang);
      navigate(
        { pathname: rest === "/" ? "/" : rest, search: `?${params.toString()}`, hash },
        { replace: true },
      );
    }
  }, [pathname, search, hash, navigate]);

  useEffect(() => {
    const onChange = (lng: string) => {
      const lang = (SUPPORTED_LANGS as readonly string[]).includes(lng) ? lng : null;
      if (!lang) return;
      const url = new URL(window.location.href);
      if (url.searchParams.get("lang") === lang) return;
      url.searchParams.set("lang", lang);
      window.history.replaceState({}, "", url.toString());
    };
    i18n.on("languageChanged", onChange);
    return () => { i18n.off("languageChanged", onChange); };
  }, []);

  return <>{children}</>;
}

function AppRoutes() {
  const { pathname } = useLocation();
  const isClient = pathname.startsWith("/espace-client") || pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");
  const isVendor = pathname.startsWith("/espace-pro");
  const isWeddingPage = pathname.startsWith("/mariage/");
  const isSharedBoard = pathname.startsWith("/mood-board/shared/");
  const isInternalGuide = pathname.startsWith("/_interne/");

  if (isInternalGuide) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/_interne/guide" element={<GuideInternePage />} />
        </Routes>
      </Suspense>
    );
  }

  if (isSharedBoard) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/mood-board/shared/:token" element={<MoodBoardSharedPage />} />
        </Routes>
      </Suspense>
    );
  }

  if (isWeddingPage) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/mariage/:slug" element={<MariagePublicPage />} />
          <Route path="/mariage/:slug/rsvp" element={<MariageRsvpPage />} />
          <Route path="/mariage/:slug/cagnotte" element={<MariageCagnottePage />} />
          <Route path="/mariage/:slug/jour-j" element={<MariageJourJPage />} />
          <Route path="*" element={<MariagePublicPage />} />
        </Routes>
      </Suspense>
    );
  }

  if (isVendor) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/espace-pro/login/*" element={<VendorSignInPage />} />
          <Route path="/espace-pro/register/*" element={<VendorSignUpPage />} />
          <Route path="/espace-pro" element={<ProtectedVendor><VendorLayout /></ProtectedVendor>}>
            <Route index element={<VendorDashboard />} />
            <Route path="profile" element={<VendorProfilePage />} />
            <Route path="gallery" element={<VendorGalleryPage />} />
            <Route path="services" element={<VendorServicesPage />} />
            <Route path="agenda" element={<VendorAvailabilityPage />} />
            <Route path="leads" element={<VendorLeadsPage />} />
            <Route path="devis" element={<VendorQuotesPage />} />
            <Route path="messages" element={<VendorMessagesPage />} />
            <Route path="settings" element={<VendorSettingsPage />} />
            <Route path="abonnement" element={<VendorAbonnementPage />} />
            <Route path="*" element={<Navigate to="/espace-pro" replace />} />
          </Route>
        </Routes>
      </Suspense>
    );
  }

  if (isClient) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route path="/espace-client/login/*" element={<SignInPage />} />
          <Route path="/espace-client/register/*" element={<SignUpPage />} />
          <Route path="/espace-client" element={<ProtectedClient><ClientLayout /></ProtectedClient>}>
            <Route index element={<Navigate to="/espace-client/dashboard" replace />} />
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route path="budget" element={<BudgetPage />} />
            <Route path="invites" element={<GuestsPage />} />
            <Route path="plan-de-table" element={<SeatingPage />} />
            <Route path="planning" element={<PlanningPage />} />
            <Route path="prestataires" element={<VendorsPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="jour-j" element={<JourJPage />} />
            <Route path="communication" element={<CommunicationPage />} />
            <Route path="site" element={<SiteMariagePage />} />
            <Route path="inspiration" element={<InspirationPage />} />
            <Route path="cagnotte" element={<CagnottePage />} />
            <Route path="devis" element={<ClientDevisPage />} />
            <Route path="profil" element={<ProfilPage />} />
            <Route path="*" element={<Navigate to="/espace-client/dashboard" replace />} />
          </Route>
        </Routes>
      </Suspense>
    );
  }

  return (
    <PublicLayout>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/plateforme" element={<Plateforme />} />
          <Route path="/services" element={<Services />} />
          <Route path="/partenaires" element={<Partenaires />} />
          <Route path="/partenaires/:id" element={<PartenaireDetail />} />
          <Route path="/prestations" element={<Navigate to="/partenaires" replace />} />
          <Route path="/comparateur" element={<Comparateur />} />
          <Route path="/lieux" element={<Lieux />} />
          <Route path="/realisations" element={<Realisations />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/a-propos" element={<About />} />
          <Route path="/about" element={<Navigate to="/a-propos" replace />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/outils/budget" element={<OutilsBudget />} />
          <Route path="/outils/quiz" element={<OutilsQuiz />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
          <Route path="/confidentialite" element={<ConfidentialitePage />} />
          <Route path="/cookies" element={<CookiesPage />} />
          {FormsKitDemo && (
            <Route path="/_dev/forms-kit" element={<FormsKitDemo />} />
          )}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </PublicLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <MariageAfroClerkProvider>
            <ScrollToTop />
            <LangUrlSync>
              <AppRoutes />
            </LangUrlSync>
          </MariageAfroClerkProvider>
        </BrowserRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
