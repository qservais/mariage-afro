import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Loader2, Upload, X, Plus } from "lucide-react";
import { vendorApi, proxyUpload } from "@/lib/vendorApi";
import { prepareImageForUpload, ACCEPTED_IMAGE_ATTR } from "@/lib/image-compress";
import { storageUrl } from "@/lib/storage-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface PackageItem {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  priceVisible: boolean;
  highlighted: boolean;
  includes: string;
}

interface VendorProfile {
  id: number;
  name: string;
  category: string;
  region?: string | null;
  city: string;
  tagline: string;
  description: string;
  videoUrl: string | null;
  indicativePrice: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  youtube: string | null;
  logoUrl: string | null;
  services: string[];
  packages?: Array<{
    id: string;
    name: string;
    subtitle?: string;
    price?: number | null;
    priceVisible: boolean;
    highlighted?: boolean;
    includes: string[];
  }>;
  videoUrls?: string[];
}

function parseVideoEmbed(url: string): { embedUrl: string | null; type: "youtube" | "vimeo" | "upload" | null } {
  if (!url) return { embedUrl: null, type: null };
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return { embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`, type: "youtube" };
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return { embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`, type: "vimeo" };
  if (url.startsWith("/objects/") || url.match(/\.(mp4|webm|mov)$/i)) return { embedUrl: storageUrl(url) ?? null, type: "upload" };
  return { embedUrl: null, type: null };
}

const REGION_VALUES = [
  "Belgique",
  "France",
  "Pays-Bas",
  "Luxembourg",
  "Allemagne",
  "Suisse",
  "Royaume-Uni",
  "Espagne",
  "Portugal",
  "Italie",
  "Toute l'Europe",
  "Toute l'Afrique",
  "Destination wedding / international",
  "Autre pays",
];

const CATEGORIES = [
  "Salle & lieu de réception",
  "Traiteur",
  "Wedding planner & coordination",
  "Décoration & wedding design",
  "Fleurs & décoration florale",
  "Photo & vidéo",
  "Content creator",
  "DJ",
  "MC & Animation",
  "Sonorisation, lumière & effets spéciaux",
  "Wedding cake & dessert",
  "Maquillage",
  "Coiffure",
  "Tenues & accessoires",
  "Hôtesses & serveurs",
  "Personnel événementiel",
  "Transport, voitures & navettes",
  "Papeterie, impression & signalétique",
  "Location de matériel, mobilier & logistique",
  "Photobooth, miroir photo & animations photos",
  "Artistes live & musiciens",
  "Danseurs & animations culturelles",
  "Officiant",
  "Cadeaux invités & souvenirs personnalisés",
  "Hébergement, hôtel & logements invités",
  "Voyage de noces & organisation lune de miel",
  "Services enfants & garderie événementielle",
  "Autre service",
];

export default function VendorProfilePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: vendor } = useQuery<VendorProfile>({
    queryKey: ["vendor", "profile"],
    queryFn: () => vendorApi.get<VendorProfile>("/api/vendor/profile"),
  });

  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [zone, setZone] = useState("");
  const [city, setCity] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [indicativePrice, setIndicativePrice] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [youtubeChannel, setYoutubeChannel] = useState("");
  const [email, setEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [additionalVideoUrls, setAdditionalVideoUrls] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!vendor) return;
    setName(vendor.name || "");
    setCategory(vendor.category || CATEGORIES[0]);
    setZone(vendor.region || "");
    setCity(vendor.city || "");
    setTagline(vendor.tagline || "");
    setDescription(vendor.description || "");
    setVideoUrl(vendor.videoUrl || "");
    setIndicativePrice(vendor.indicativePrice || "");
    setWebsite(vendor.website || "");
    setPhone(vendor.phone || "");
    setInstagram(vendor.instagram || "");
    setFacebook(vendor.facebook || "");
    setTiktok(vendor.tiktok || "");
    setYoutubeChannel(vendor.youtube || "");
    setEmail(vendor.email || "");
    setLogoUrl(vendor.logoUrl || null);
    setPackages(
      (vendor.packages ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        subtitle: p.subtitle ?? "",
        price: p.price != null ? String(p.price) : "",
        priceVisible: p.priceVisible,
        highlighted: p.highlighted ?? false,
        includes: (p.includes ?? []).join("\n"),
      }))
    );
    setAdditionalVideoUrls(vendor.videoUrls ?? []);
  }, [vendor]);

  function addPackage() {
    setPackages((prev) => [
      ...prev,
      { id: `pkg-${Date.now()}`, name: "", subtitle: "", price: "", priceVisible: false, highlighted: false, includes: "" },
    ]);
  }

  function removePackage(idx: number) {
    setPackages((prev) => prev.filter((_, i) => i !== idx));
  }

  function updatePkg(idx: number, field: keyof PackageItem, value: string | boolean) {
    setPackages((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  }

  const save = useMutation({
    mutationFn: (b: Record<string, unknown>) => vendorApi.patch("/api/vendor/profile", b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor", "profile"] });
      qc.invalidateQueries({ queryKey: ["vendor", "me"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({ title: t("vendor.profile.saved") });
    },
    onError: () => toast({ title: t("vendor.profile.save_error", { defaultValue: "Impossible d'enregistrer les modifications" }), variant: "destructive" }),
  });

  async function pickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0];
    if (!raw) return;
    setLogoError(null);
    setLogoUploading(true);
    try {
      const { file, error } = await prepareImageForUpload(raw, {
        maxWidth: 600, maxHeight: 600, quality: 0.88, mimeType: "image/jpeg",
      });
      if (error) { setLogoError(error); return; }
      const { objectPath } = await proxyUpload(file);
      setLogoUrl(objectPath);
    } catch (err) {
      setLogoError((err as Error).message);
    } finally {
      setLogoUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function pickVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoError(null);
    setVideoUploading(true);
    try {
      const { objectPath } = await proxyUpload(file);
      setVideoUrl(objectPath);
    } catch (err) {
      setVideoError((err as Error).message);
    } finally {
      setVideoUploading(false);
      if (videoRef.current) videoRef.current.value = "";
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-wine-deep">{t("vendor.profile.title")}</h2>
        <p className="text-sm text-neutral-600 mt-1">{t("vendor.profile.subtitle")}</p>
      </div>

      <form
        className="bg-cream border border-neutral-200 p-6 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate({
            name, category, region: zone || null, city, tagline, description,
            videoUrl: videoUrl || null,
            indicativePrice: indicativePrice || null,
            website: website || null,
            phone: phone || null,
            email: email || undefined,
            logoUrl: logoUrl || null,
            instagram: instagram || null,
            facebook: facebook || null,
            tiktok: tiktok || null,
            youtube: youtubeChannel || null,
            packages: packages.filter((p) => p.name.trim()).map((p) => ({
              id: p.id,
              name: p.name.trim(),
              ...(p.subtitle.trim() ? { subtitle: p.subtitle.trim() } : {}),
              price: p.price !== "" ? parseFloat(p.price) || null : null,
              priceVisible: p.priceVisible,
              highlighted: p.highlighted,
              includes: p.includes.split("\n").map((s) => s.trim()).filter(Boolean),
            })),
            videoUrls: additionalVideoUrls.filter(Boolean),
          });
        }}
      >
        {/* Logo */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">
            {t("vendor.profile.logo")}
          </label>
          <p className="text-xs text-neutral-500 -mt-1">{t("vendor.profile.logo_help")}</p>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 border border-neutral-200 bg-neutral-50 flex items-center justify-center overflow-hidden flex-shrink-0">
              {logoUrl ? (
                <img src={storageUrl(logoUrl) ?? ""} alt="logo" className="w-full h-full object-cover" data-testid="logo-preview" />
              ) : (
                <span className="text-[10px] uppercase tracking-wider text-neutral-400">{t("vendor.profile.logo_empty")}</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPTED_IMAGE_ATTR}
                onChange={pickLogo}
                className="hidden"
                data-testid="input-logo-file"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-none uppercase tracking-wider text-xs"
                disabled={logoUploading}
                onClick={() => fileRef.current?.click()}
                data-testid="button-logo-upload"
              >
                {logoUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                {logoUrl ? t("vendor.profile.logo_replace") : t("vendor.profile.logo_upload")}
              </Button>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl(null)}
                  className="text-xs text-neutral-500 hover:text-red-600 flex items-center gap-1 self-start"
                  data-testid="button-logo-remove"
                >
                  <X className="w-3 h-3" /> {t("vendor.profile.logo_remove")}
                </button>
              )}
              {logoError && <p className="text-xs text-red-600">{logoError}</p>}
            </div>
          </div>
        </div>

        {/* Core fields */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("vendor.profile.name")}</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} data-testid="input-profile-name" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("vendor.profile.category")}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-input bg-background px-3 py-2 text-sm"
              data-testid="select-profile-category"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("vendor.onboarding.regions_label", { defaultValue: "Zone d'intervention" })}</label>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full border border-input bg-background px-3 py-2 text-sm"
              data-testid="select-profile-zone"
            >
              <option value="">{t("vendor.profile.zone_placeholder", { defaultValue: "— Sélectionner —" })}</option>
              {REGION_VALUES.map((r) => <option key={r} value={r}>{t(`vendor.onboarding.regions.${r}`, { defaultValue: r })}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("vendor.profile.city")}</label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} data-testid="input-profile-city" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("vendor.profile.tagline")}</label>
            <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder={t("vendor.profile.tagline_placeholder")} data-testid="input-profile-tagline" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("vendor.profile.description")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full border border-input bg-background px-3 py-2 text-sm"
              data-testid="textarea-profile-description"
            />
            <p className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
              <span>🌐</span> {t("vendor.profile.description_auto_hint")}
            </p>
          </div>
        </div>

        {/* Video + price */}
        <div className="border-t border-neutral-100 pt-5 grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("vendor.profile.video_url")}</label>
            <div className="flex gap-2">
              <Input
                value={videoUrl}
                onChange={(e) => { setVideoUrl(e.target.value); setShowVideoPreview(false); }}
                placeholder={t("vendor.profile.video_url_help")}
                data-testid="input-profile-video-url"
                className="flex-1"
              />
              {videoUrl && (
                <button
                  type="button"
                  onClick={() => setShowVideoPreview((v) => !v)}
                  className="px-3 h-9 border border-neutral-300 text-neutral-700 text-[11px] uppercase tracking-wider hover:border-wine-deep hover:text-wine-deep transition-colors whitespace-nowrap"
                  data-testid="button-video-preview"
                >
                  {t("vendor.profile.video_preview_btn")}
                </button>
              )}
              <label className="inline-flex items-center gap-1.5 px-3 h-9 border border-wine-deep text-wine-deep text-[11px] uppercase tracking-wider cursor-pointer hover:bg-wine-deep hover:text-cream transition-colors whitespace-nowrap">
                {videoUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {t("vendor.profile.upload_video")}
                <input
                  ref={videoRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/mov"
                  className="hidden"
                  onChange={pickVideo}
                  disabled={videoUploading}
                />
              </label>
            </div>
            {videoError && <p className="text-[11px] text-red-600 mt-1">{videoError}</p>}
            <p className="text-[11px] text-neutral-400 mt-1">{t("vendor.profile.video_url_help")}</p>
            {showVideoPreview && (() => {
              const { embedUrl, type } = parseVideoEmbed(videoUrl);
              if (!embedUrl) return <p className="text-[11px] text-red-500 mt-2">{t("vendor.profile.video_preview_invalid")}</p>;
              if (type === "upload") return (
                <video src={embedUrl} controls className="mt-3 w-full max-w-sm aspect-video bg-black" data-testid="video-preview-player" />
              );
              return (
                <div className="mt-3 w-full max-w-sm aspect-video" data-testid="video-preview-embed">
                  <iframe src={embedUrl} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Video preview" />
                </div>
              );
            })()}
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("vendor.profile.indicative_price")}</label>
            <Input
              value={indicativePrice}
              onChange={(e) => setIndicativePrice(e.target.value)}
              placeholder={t("vendor.profile.indicative_price_placeholder")}
              data-testid="input-profile-indicative-price"
            />
          </div>
        </div>

        {/* Contact */}
        <div className="border-t border-neutral-100 pt-5 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("vendor.profile.email")}</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="input-profile-email" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("vendor.profile.phone")}</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="input-profile-phone" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("vendor.profile.website")}</label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" data-testid="input-profile-website" />
          </div>
        </div>

        {/* Social media */}
        <div className="border-t border-neutral-100 pt-5 space-y-3">
          <p className="text-xs uppercase tracking-wider text-wine-deep font-semibold">{t("vendor.profile.social_title")}</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("vendor.profile.instagram")}</label>
              <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder={t("vendor.profile.instagram_placeholder")} data-testid="input-profile-instagram" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("vendor.profile.facebook")}</label>
              <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder={t("vendor.profile.facebook_placeholder")} data-testid="input-profile-facebook" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("vendor.profile.tiktok")}</label>
              <Input value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder={t("vendor.profile.tiktok_placeholder")} data-testid="input-profile-tiktok" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("vendor.profile.youtube_channel")}</label>
              <Input value={youtubeChannel} onChange={(e) => setYoutubeChannel(e.target.value)} placeholder={t("vendor.profile.youtube_channel_placeholder")} data-testid="input-profile-youtube" />
            </div>
          </div>
        </div>

        {/* Packages / Formules */}
        <div className="border-t border-neutral-100 pt-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-wine-deep font-semibold">Formules & Packages</p>
            {packages.length < 6 && (
              <button type="button" onClick={addPackage} className="inline-flex items-center gap-1 text-xs text-wine-deep hover:text-gold transition-colors">
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </button>
            )}
          </div>
          {packages.length === 0 && (
            <p className="text-xs text-neutral-400 italic">
              Aucune formule — créez jusqu'à 6 packages pour présenter vos offres aux couples.
            </p>
          )}
          <div className="space-y-4">
            {packages.map((pkg, idx) => (
              <div key={pkg.id} className="border border-neutral-200 p-4 space-y-3 bg-cream-soft">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-wine-deep uppercase tracking-wider">Formule {idx + 1}</span>
                  <button type="button" onClick={() => removePackage(idx)} className="text-neutral-400 hover:text-red-600 transition-colors" aria-label="Supprimer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-neutral-500 block mb-1">Nom *</label>
                    <Input value={pkg.name} onChange={(e) => updatePkg(idx, "name", e.target.value)} placeholder="ex : Formule Premium" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-neutral-500 block mb-1">Sous-titre</label>
                    <Input value={pkg.subtitle} onChange={(e) => updatePkg(idx, "subtitle", e.target.value)} placeholder="ex : Notre formule la plus populaire" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-neutral-500 block mb-1">Prix (€)</label>
                    <Input type="number" min="0" value={pkg.price} onChange={(e) => updatePkg(idx, "price", e.target.value)} placeholder="ex : 2500" />
                  </div>
                  <div className="flex flex-col gap-2 justify-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={pkg.priceVisible} onChange={(e) => updatePkg(idx, "priceVisible", e.target.checked)} className="accent-wine-deep" />
                      <span className="text-xs text-neutral-600">Afficher le prix</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={pkg.highlighted} onChange={(e) => updatePkg(idx, "highlighted", e.target.checked)} className="accent-wine-deep" />
                      <span className="text-xs text-neutral-600">Mettre en avant</span>
                    </label>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] uppercase tracking-wider text-neutral-500 block mb-1">
                      Ce qui est inclus <span className="text-neutral-400 normal-case">(une ligne par élément)</span>
                    </label>
                    <textarea
                      value={pkg.includes}
                      onChange={(e) => updatePkg(idx, "includes", e.target.value)}
                      rows={4}
                      className="w-full border border-input bg-background px-3 py-2 text-sm"
                      placeholder={"Consultation créative 2h\nDécoration de la salle\nMise en place le jour J"}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional video URLs */}
        <div className="border-t border-neutral-100 pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-wine-deep font-semibold">Vidéos supplémentaires</p>
            {additionalVideoUrls.length < 5 && (
              <button type="button" onClick={() => setAdditionalVideoUrls((v) => [...v, ""])} className="inline-flex items-center gap-1 text-xs text-wine-deep hover:text-gold transition-colors">
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </button>
            )}
          </div>
          <p className="text-[11px] text-neutral-400">
            Liens YouTube ou Vimeo additionnels affichés sur votre page publique. Max&nbsp;5.
          </p>
          {additionalVideoUrls.map((url, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => setAdditionalVideoUrls((v) => v.map((u, j) => (j === i ? e.target.value : u)))}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1"
              />
              <button type="button" onClick={() => setAdditionalVideoUrls((v) => v.filter((_, j) => j !== i))} className="px-2 text-neutral-400 hover:text-red-600 transition-colors" aria-label="Supprimer">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 pt-2">
          <Button
            type="submit"
            className="rounded-none uppercase tracking-wider text-xs bg-wine-deep text-cream hover:bg-wine-deep/90"
            disabled={save.isPending}
            data-testid="button-profile-save"
          >
            {save.isPending ? t("vendor.profile.saving") : t("vendor.profile.save")}
          </Button>
          {saved && <p className="text-sm text-gold-deep">{t("vendor.profile.saved")}</p>}
          {save.isError && <p className="text-sm text-red-600">{(save.error as Error).message}</p>}
        </div>
      </form>
    </div>
  );
}
