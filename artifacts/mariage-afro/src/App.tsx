import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import i18n, { SUPPORTED_LANGS, type SupportedLang } from "@/i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Show } from "@clerk/react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Services from "@/pages/services";
import Plateforme from "@/pages/plateforme";
import Partenaires from "@/pages/prestations";
import PartenaireDetail from "@/pages/prestataires-detail";
import Lieux from "@/pages/lieux";
import Comparateur from "@/pages/comparateur";
import Shop from "@/pages/shop";
import Realisations from "@/pages/realisations";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import OutilsBudget from "@/pages/outils-budget";
import OutilsQuiz from "@/pages/outils-quiz";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import ClientLayout from "@/components/client/ClientLayout";
import ClientDashboard from "@/pages/client/dashboard";
import BudgetPage from "@/pages/client/budget";
import GuestsPage from "@/pages/client/invites";
import SeatingPage from "@/pages/client/seating";
import PlanningPage from "@/pages/client/planning";
import VendorsPage from "@/pages/client/prestataires";
import DocumentsPage from "@/pages/client/documents";
import JourJPage from "@/pages/client/jour-j";
import ProfilPage from "@/pages/client/profil";
import CommunicationPage from "@/pages/client/communication";
import SiteMariagePage from "@/pages/client/site-mariage";
import InspirationPage from "@/pages/client/inspiration";
import CagnottePage from "@/pages/client/cagnotte";
import MariagePublicPage from "@/pages/mariage-public";
import MariageRsvpPage from "@/pages/mariage-rsvp";
import MariageCagnottePage from "@/pages/mariage-cagnotte";
import MoodBoardSharedPage from "@/pages/mood-board-shared";
import VendorLayout from "@/components/vendor/VendorLayout";
import VendorDashboard from "@/pages/vendor/dashboard";
import VendorProfilePage from "@/pages/vendor/profile";
import VendorGalleryPage from "@/pages/vendor/gallery";
import VendorServicesPage from "@/pages/vendor/services";
import VendorSettingsPage from "@/pages/vendor/settings";
import VendorAvailabilityPage from "@/pages/vendor/availability";
import VendorLeadsPage from "@/pages/vendor/leads";
import VendorMessagesPage from "@/pages/vendor/messages";
import VendorAbonnementPage from "@/pages/vendor/abonnement";
import VendorSignInPage from "@/pages/vendor/sign-in";
import VendorSignUpPage from "@/pages/vendor/sign-up";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { MariageAfroClerkProvider } from "@/lib/clerk";
import "./i18n";

const queryClient = new QueryClient();

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
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ExitIntentPopup />
    </div>
  );
}

function LangUrlSync({ children }: { children: React.ReactNode }) {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();

  // Inbound: /<lang>/path → strip prefix, persist via ?lang=
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

  // Outbound: when language toggles, mirror it into ?lang= so the URL stays shareable
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

  if (isSharedBoard) {
    return (
      <Routes>
        <Route path="/mood-board/shared/:token" element={<MoodBoardSharedPage />} />
      </Routes>
    );
  }

  if (isWeddingPage) {
    return (
      <Routes>
        <Route path="/mariage/:slug" element={<MariagePublicPage />} />
        <Route path="/mariage/:slug/rsvp" element={<MariageRsvpPage />} />
        <Route path="/mariage/:slug/cagnotte" element={<MariageCagnottePage />} />
        <Route path="*" element={<MariagePublicPage />} />
      </Routes>
    );
  }

  if (isVendor) {
    return (
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
          <Route path="messages" element={<VendorMessagesPage />} />
          <Route path="settings" element={<VendorSettingsPage />} />
          <Route path="abonnement" element={<VendorAbonnementPage />} />
          <Route path="*" element={<Navigate to="/espace-pro" replace />} />
        </Route>
      </Routes>
    );
  }

  if (isClient) {
    return (
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
          <Route path="profil" element={<ProfilPage />} />
          <Route path="*" element={<Navigate to="/espace-client/dashboard" replace />} />
        </Route>
      </Routes>
    );
  }

  return (
    <PublicLayout>
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
        <Route path="*" element={<NotFound />} />
      </Routes>
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
