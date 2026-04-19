import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Services from "@/pages/services";
import Plateforme from "@/pages/plateforme";
import Partenaires from "@/pages/prestations";
import Lieux from "@/pages/lieux";
import Shop from "@/pages/shop";
import EspaceClient from "@/pages/espace-client";
import Realisations from "@/pages/realisations";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingCTA from "@/components/layout/FloatingCTA";
import ScrollToTop from "@/components/layout/ScrollToTop";
import "./i18n";

const queryClient = new QueryClient();

function Router() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <ScrollToTop />
      <Header />
      <main className="flex-1">
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
          <Route path="/espace-client" element={<EspaceClient />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <FloatingCTA />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </BrowserRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
