import { useState, useEffect, FormEvent } from "react";
import { X, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const INPUT_CLS =
  "w-full bg-transparent border-b border-wine-deep/20 px-0 py-3 text-base text-wine-deep placeholder-wine-deep/30 focus:outline-none focus:border-gold transition-colors";

interface Slot { date: string; time: string }

interface Props {
  venueName: string;
  requestType: "visit" | "quote";
  onClose: () => void;
}

export default function VenueRequestModal({ venueName, requestType, onClose }: Props) {
  const { t } = useTranslation();

  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [phone, setPhone]             = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [guestCount, setGuestCount]   = useState("");
  const [message, setMessage]         = useState("");
  const [slots, setSlots]             = useState<Slot[]>([{ date: "", time: "" }]);
  const [submitting, setSubmitting]   = useState(false);
  const [done, setDone]               = useState(false);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const addSlot    = () => { if (slots.length < 3) setSlots((s) => [...s, { date: "", time: "" }]); };
  const removeSlot = (i: number) => setSlots((s) => s.filter((_, idx) => idx !== i));
  const updateSlot = (i: number, field: "date" | "time", val: string) =>
    setSlots((s) => s.map((sl, idx) => (idx === i ? { ...sl, [field]: val } : sl)));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const validSlots = slots.filter((s) => s.date).map((s) => ({ date: s.date, time: s.time || null }));
      const res = await fetch("/api/venue-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueName,
          requestType,
          name:        name.trim(),
          email:       email.trim(),
          phone:       phone.trim() || null,
          weddingDate: weddingDate || null,
          guestCount:  guestCount ? parseInt(guestCount, 10) : null,
          message:     message.trim() || null,
          visitSlots:  requestType === "visit" && validSlots.length > 0 ? validSlots : null,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(json.error ?? "Erreur serveur");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setSubmitting(false);
    }
  }

  const isVisit = requestType === "visit";
  const title   = isVisit ? "Demande de visite" : "Demande de devis";
  const labelCls = "block text-[10px] uppercase tracking-[0.3em] font-medium text-gold-deep mb-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative bg-cream w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-wine-deep text-cream px-8 py-6 flex items-start justify-between z-10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-gold mb-1">{venueName}</p>
            <h2 className="font-display text-2xl md:text-3xl tracking-tight leading-tight">{title}</h2>
          </div>
          <button onClick={onClose} className="text-cream/60 hover:text-cream transition-colors ml-4 mt-1 flex-shrink-0" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="px-8 py-16 text-center">
            <CheckCircle2 className="w-12 h-12 text-gold mx-auto mb-5" strokeWidth={1.5} />
            <h3 className="font-display text-2xl text-wine-deep mb-3">Demande envoyée !</h3>
            <p className="text-wine-deep/70 text-sm leading-relaxed max-w-xs mx-auto mb-8">
              Notre équipe reviendra vers vous très rapidement pour finaliser les détails.
            </p>
            <button onClick={onClose} className="btn-editorial">Fermer</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">

            {/* Nom */}
            <div>
              <label className={labelCls}>Nom complet des mariés <span className="text-wine-deep">*</span></label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Marie & Jean Dupont" className={INPUT_CLS} />
            </div>

            {/* Email + Téléphone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className={labelCls}>Email <span className="text-wine-deep">*</span></label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="marie@example.com" className={INPUT_CLS} />
              </div>
              <div>
                <label className={labelCls}>Téléphone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="+32 4xx xx xx xx" className={INPUT_CLS} />
              </div>
            </div>

            {/* Date mariage + Invités */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className={labelCls}>Date du mariage</label>
                <input type="date" value={weddingDate} onChange={(e) => setWeddingDate(e.target.value)} className={INPUT_CLS} />
              </div>
              <div>
                <label className={labelCls}>Nombre d'invités</label>
                <input type="number" min="1" value={guestCount} onChange={(e) => setGuestCount(e.target.value)}
                  placeholder="ex. 150" className={INPUT_CLS} />
              </div>
            </div>

            {/* Disponibilités (visite uniquement) */}
            {isVisit && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className={labelCls}>
                    Vos disponibilités
                    <span className="ml-2 normal-case tracking-normal font-light text-wine-deep/40 text-[10px]">
                      (jusqu'à 3 créneaux)
                    </span>
                  </label>
                  {slots.length < 3 && (
                    <button type="button" onClick={addSlot}
                      className="flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-gold-deep hover:text-wine-deep transition-colors font-semibold">
                      <Plus className="w-3 h-3" /> Ajouter
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {slots.map((slot, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <input type="date" value={slot.date} onChange={(e) => updateSlot(i, "date", e.target.value)}
                        className={INPUT_CLS + " flex-1"} />
                      <input type="time" value={slot.time} onChange={(e) => updateSlot(i, "time", e.target.value)}
                        className={INPUT_CLS + " w-28"} />
                      {slots.length > 1 && (
                        <button type="button" onClick={() => removeSlot(i)}
                          className="text-wine-deep/25 hover:text-wine-deep/60 transition-colors flex-shrink-0" aria-label="Supprimer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message */}
            <div>
              <label className={labelCls}>Message / précisions</label>
              <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)}
                placeholder="Décrivez votre mariage, vos besoins particuliers…"
                className={INPUT_CLS + " resize-none"} />
            </div>

            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3">{error}</p>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button type="button" onClick={onClose} className="btn-editorial-compact flex-1 justify-center">
                Annuler
              </button>
              <button type="submit" disabled={submitting}
                className="btn-editorial-compact-solid flex-1 justify-center disabled:opacity-60">
                {submitting ? "Envoi en cours…" : "Envoyer la demande"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
