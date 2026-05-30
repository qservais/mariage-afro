import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await fetch(`${BASE}/api/auth/forgot-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setError(t("auth.forgot_error", { defaultValue: "Une erreur est survenue. Réessayez." }));
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
          <h1 className="font-display text-3xl text-wine-deep">
            {t("auth.forgot_title", { defaultValue: "Mot de passe oublié" })}
          </h1>
        </div>

        <div className="border border-wine-deep/10 bg-cream-soft p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto">
                <span className="text-gold-deep text-xl">✓</span>
              </div>
              <p className="text-wine-deep text-sm leading-relaxed">
                {t("auth.forgot_sent", { defaultValue: "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation dans quelques minutes." })}
              </p>
              <Link to="/espace-client/login" className="text-primary text-sm font-semibold hover:underline underline-offset-2">
                {t("auth.back_to_login", { defaultValue: "Retour à la connexion" })}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <p className="text-sm text-wine-deep/60 leading-relaxed">
                {t("auth.forgot_desc", { defaultValue: "Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe." })}
              </p>

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

              {error && (
                <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-cream border border-primary hover:bg-bordeaux-light px-6 py-3 text-[11px] uppercase tracking-[0.25em] font-semibold transition-colors disabled:opacity-60"
              >
                {loading ? t("auth.sending", { defaultValue: "Envoi…" }) : t("auth.send_reset_link", { defaultValue: "Envoyer le lien" })}
              </button>

              <p className="text-center text-sm text-wine-deep/50">
                <Link to="/espace-client/login" className="text-primary font-semibold hover:underline underline-offset-2">
                  {t("auth.back_to_login", { defaultValue: "Retour à la connexion" })}
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
