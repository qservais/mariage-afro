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
import PlanningPage from "@/pages/client/planning";
import VendorsPage from "@/pages/client/prestataires";
import DocumentsPage from "@/pages/client/documents";
import JourJPage from "@/pages/client/jour-j";
import ProfilPage from "@/pages/client/profil";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingCTA from "@/components/layout/FloatingCTA";
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

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingCTA />
    </div>
  );
}

function AppRoutes() {
  const { pathname } = useLocation();
  const isClient = pathname.startsWith("/espace-client") || pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

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
          <Route path="planning" element={<PlanningPage />} />
          <Route path="prestataires" element={<VendorsPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="jour-j" element={<JourJPage />} />
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
        <Route path="/lieux" element={<Lieux />} />
        <Route path="/realisations" element={<Realisations />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/a-propos" element={<About />} />
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
