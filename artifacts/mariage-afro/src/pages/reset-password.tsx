import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError(t("auth.passwords_mismatch", { defaultValue: "Les mots de passe ne correspondent pas" }));
      return;
    }
    if (password.length < 8) {
      setError(t("auth.password_too_short", { defaultValue: "Au moins 8 caractères" }));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/auth/reset-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "Erreur"); return; }
      setDone(true);
      setTimeout(() => navigate("/espace-client/login", { replace: true }), 2000);
    } catch {
      setError(t("auth.reset_error", { defaultValue: "Une erreur est survenue. Réessayez." }));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-cream px-4">
        <div className="text-center">
          <p className="text-wine-deep/70 mb-4">{t("auth.invalid_link", { defaultValue: "Lien invalide ou expiré." })}</p>
          <Link to="/espace-client/mot-de-passe-oublie" className="text-primary font-semibold underline underline-offset-2">
            {t("auth.request_new_link", { defaultValue: "Demander un nouveau lien" })}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-cream px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-primary mb-6">
            <Heart className="w-4 h-4 fill-primary" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em]">Mariage Afro</span>
          </Link>
          <h1 className="font-display text-3xl text-wine-deep">
            {t("auth.reset_title", { defaultValue: "Nouveau mot de passe" })}
          </h1>
        </div>

        <div className="border border-wine-deep/10 bg-cream-soft p-8">
          {done ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-green-50 border border-green-200 flex items-center justify-center mx-auto">
                <span className="text-green-600 text-xl">✓</span>
              </div>
              <p className="text-wine-deep text-sm">
                {t("auth.reset_done", { defaultValue: "Mot de passe modifié. Redirection…" })}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="password" className="block text-[11px] uppercase tracking-[0.18em] text-wine-deep/60 font-medium mb-1.5">
                  {t("auth.new_password", { defaultValue: "Nouveau mot de passe" })}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-wine-deep/20 bg-cream px-4 py-3 pr-12 text-sm text-wine-deep focus:outline-none focus:border-primary transition-colors"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} aria-label={showPwd ? "Masquer" : "Afficher"} className="absolute right-3 top-1/2 -translate-y-1/2 text-wine-deep/40 hover:text-wine-deep">
                    {showPwd ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm" className="block text-[11px] uppercase tracking-[0.18em] text-wine-deep/60 font-medium mb-1.5">
                  {t("auth.confirm_password", { defaultValue: "Confirmer le mot de passe" })}
                </label>
                <input
                  id="confirm"
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full border border-wine-deep/20 bg-cream px-4 py-3 text-sm text-wine-deep focus:outline-none focus:border-primary transition-colors"
                  placeholder="••••••••"
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
                {loading ? t("auth.saving", { defaultValue: "Enregistrement…" }) : t("auth.save_password", { defaultValue: "Enregistrer le mot de passe" })}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
