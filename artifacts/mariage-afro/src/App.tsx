import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Show } from "@clerk/react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Services from "@/pages/services";
import Plateforme from "@/pages/plateforme";
import Partenaires from "@/pages/prestations";
import Lieux from "@/pages/lieux";
import Comparateur from "@/pages/comparateur";
import Shop from "@/pages/shop";
import Realisations from "@/pages/realisations";
import About from "@/pages/about";
import Contact from "@/pages/contact";
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
import MariagePublicPage from "@/pages/mariage-public";
import VendorLayout from "@/components/vendor/VendorLayout";
import VendorDashboard from "@/pages/vendor/dashboard";
import VendorProfilePage from "@/pages/vendor/profile";
import VendorGalleryPage from "@/pages/vendor/gallery";
import VendorServicesPage from "@/pages/vendor/services";
import VendorSettingsPage from "@/pages/vendor/settings";
import VendorAvailabilityPage from "@/pages/vendor/availability";
import VendorLeadsPage from "@/pages/vendor/leads";
import VendorMessagesPage from "@/pages/vendor/messages";
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
    </div>
  );
}

function AppRoutes() {
  const { pathname } = useLocation();
  const isClient = pathname.startsWith("/espace-client") || pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");
  const isVendor = pathname.startsWith("/espace-pro");
  const isWeddingPage = pathname.startsWith("/mariage/");

  if (isWeddingPage) {
    return (
      <Routes>
        <Route path="/mariage/:slug" element={<MariagePublicPage />} />
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
        <Route path="/prestations" element={<Navigate to="/partenaires" replace />} />
        <Route path="/comparateur" element={<Comparateur />} />
        <Route path="/lieux" element={<Lieux />} />
        <Route path="/realisations" element={<Realisations />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/a-propos" element={<About />} />
        <Route path="/about" element={<Navigate to="/a-propos" replace />} />
        <Route path="/contact" element={<Contact />} />
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
            <AppRoutes />
          </MariageAfroClerkProvider>
        </BrowserRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
