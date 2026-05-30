import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Loader2, Upload, X } from "lucide-react";
import { vendorApi, proxyUpload } from "@/lib/vendorApi";
import { prepareImageForUpload, ACCEPTED_IMAGE_ATTR } from "@/lib/image-compress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface VendorProfile {
  id: number;
  name: string;
  category: string;
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
}

function objectStorageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/objects/")) return `/api/storage${path}`;
  return path;
}

function parseVideoEmbed(url: string): { embedUrl: string | null; type: "youtube" | "vimeo" | "upload" | null } {
  if (!url) return { embedUrl: null, type: null };
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return { embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`, type: "youtube" };
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return { embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`, type: "vimeo" };
  if (url.startsWith("/objects/") || url.match(/\.(mp4|webm|mov)$/i)) return { embedUrl: objectStorageUrl(url), type: "upload" };
  return { embedUrl: null, type: null };
}

const CATEGORIES = [
  "Photographie", "Vidéo", "DJ & Animation", "Décoration", "Traiteur",
  "Coiffure & Maquillage", "Robe de mariée", "Transport", "Invitations",
  "Lieu de réception", "Autre",
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
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!vendor) return;
    setName(vendor.name || "");
    setCategory(vendor.category || CATEGORIES[0]);
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
  }, [vendor]);

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
            name, category, city, tagline, description,
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
                // eslint-disable-next-line @next/next/no-img-element
                <img src={objectStorageUrl(logoUrl) ?? ""} alt="logo" className="w-full h-full object-cover" data-testid="logo-preview" />
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
                {logoUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
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
              if (!embedUrl) return (
                <p className="text-[11px] text-red-500 mt-2">{t("vendor.profile.video_preview_invalid")}</p>
              );
              if (type === "upload") return (
                <video
                  src={embedUrl}
                  controls
                  className="mt-3 w-full max-w-sm aspect-video bg-black"
                  data-testid="video-preview-player"
                />
              );
              return (
                <div className="mt-3 w-full max-w-sm aspect-video" data-testid="video-preview-embed">
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Video preview"
                  />
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

        <div className="flex items-center gap-4">
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
