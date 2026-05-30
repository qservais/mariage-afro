import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Heart } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function SignInPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect") ?? "/espace-client";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password, "client");
      navigate(redirect, { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-cream px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-primary mb-6">
            <Heart className="w-4 h-4 fill-primary" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em]">Mariage Afro</span>
          </Link>
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary mb-2">{t("auth.client.eyebrow")}</p>
          <h1 className="font-display text-3xl text-wine-deep">{t("auth.client.title")}</h1>
        </div>

        <div className="border border-wine-deep/10 bg-cream-soft p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="block text-[11px] uppercase tracking-[0.18em] text-wine-deep/60 font-medium mb-1.5">
                {t("auth.email_label", { defaultValue: "Adresse email" })}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-wine-deep/20 bg-cream px-4 py-3 text-sm text-wine-deep placeholder:text-wine-deep/30 focus:outline-none focus:border-primary transition-colors"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[11px] uppercase tracking-[0.18em] text-wine-deep/60 font-medium mb-1.5">
                {t("auth.password_label", { defaultValue: "Mot de passe" })}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-wine-deep/20 bg-cream px-4 py-3 pr-12 text-sm text-wine-deep placeholder:text-wine-deep/30 focus:outline-none focus:border-primary transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-wine-deep/40 hover:text-wine-deep transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link
                to="/espace-client/mot-de-passe-oublie"
                className="text-xs text-wine-deep/50 hover:text-primary transition-colors underline underline-offset-2"
              >
                {t("auth.forgot_password", { defaultValue: "Mot de passe oublié ?" })}
              </Link>
            </div>

            {error && (
              <p role="alert" className="text-sm text-wine-deep bg-wine-deep/5 border border-wine-deep/20 px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-cream border border-primary hover:bg-bordeaux-light hover:border-bordeaux-light px-6 py-3 text-[11px] uppercase tracking-[0.25em] font-semibold transition-colors disabled:opacity-60"
            >
              {loading ? t("auth.signing_in", { defaultValue: "Connexion…" }) : t("auth.sign_in", { defaultValue: "Se connecter" })}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-wine-deep/50">
            {t("auth.no_account", { defaultValue: "Pas encore de compte ?" })}{" "}
            <Link to="/espace-client/register" className="text-primary font-semibold hover:underline underline-offset-2">
              {t("auth.create_account", { defaultValue: "Créer un compte" })}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
