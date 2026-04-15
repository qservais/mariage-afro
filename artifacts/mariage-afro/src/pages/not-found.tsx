import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background pt-28">
      <div className="text-center px-6">
        <span className="text-7xl font-bold text-primary/20 font-serif">404</span>
        <h1 className="text-3xl font-bold font-serif text-foreground mt-4 mb-4">Page introuvable</h1>
        <p className="text-muted-foreground mb-8">La page que vous recherchez n'existe pas ou a été déplacée.</p>
        <Link to="/" className="inline-block bg-primary text-white px-8 py-3 uppercase tracking-wider text-sm font-bold hover:bg-primary/90 transition-colors">
          Retourner à l'accueil
        </Link>
      </div>
    </div>
  );
}
