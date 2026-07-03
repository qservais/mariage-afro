import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Heart } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function SignUpPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError(t("auth.passwords_mismatch", { defaultValue: "Les mots de passe ne correspondent pas" }));
      return;
    }
    if (password.length < 8) {
      setError(t("auth.password_too_short", { defaultValue: "Le mot de passe doit contenir au moins 8 caractères" }));
      return;
    }
    setLoading(true);
    try {
      await register(email, password, "client");
      navigate("/espace-client", { replace: true });
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
          <h1 className="font-display text-3xl text-wine-deep">{t("auth.register_title", { defaultValue: "Créer votre compte" })}</h1>
          <p className="text-sm text-wine-deep/50 mt-2">{t("auth.register_subtitle", { defaultValue: "Rejoignez Mariage Afro" })}</p>
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
                <span className="ml-2 text-wine-deep/40 font-light normal-case tracking-normal">
                  ({t("auth.password_hint", { defaultValue: "8 caractères minimum" })})
                </span>
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
                  className="w-full border border-wine-deep/20 bg-cream px-4 py-3 pr-12 text-sm text-wine-deep placeholder:text-wine-deep/30 focus:outline-none focus:border-primary transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  aria-label={showPwd ? t("auth.password_hide") : t("auth.password_show")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-wine-deep/40 hover:text-wine-deep"
                >
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
                className="w-full border border-wine-deep/20 bg-cream px-4 py-3 text-sm text-wine-deep placeholder:text-wine-deep/30 focus:outline-none focus:border-primary transition-colors"
                placeholder="••••••••"
              />
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
              {loading ? t("auth.creating", { defaultValue: "Création…" }) : t("auth.create_account", { defaultValue: "Créer mon compte" })}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-wine-deep/50">
            {t("auth.already_account", { defaultValue: "Déjà un compte ?" })}{" "}
            <Link to="/espace-client/login" className="text-primary font-semibold hover:underline underline-offset-2">
              {t("auth.sign_in", { defaultValue: "Se connecter" })}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
