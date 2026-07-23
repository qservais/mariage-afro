import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resolveColor } from "@/lib/brand-colors";
import { Globe, Eye, EyeOff, Plus, Trash2, ExternalLink, Loader2, Check, Search, Upload, X, Copy, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { prepareImageForUpload, ACCEPTED_IMAGE_ATTR } from "@/lib/image-compress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { clientFetch, clientProxyUpload } from "@/lib/clientApi";
import { storageUrl as coverImageDisplayUrl } from "@/lib/storage-url";
import {
  WEDDING_TEMPLATE_IDS,
  WEDDING_FONT_HEADINGS,
  TemplateThumbnail,
  normalizeTemplate,
  type WeddingTemplateId,
  type WeddingFontHeading,
} from "@/lib/wedding-templates";
import { WeddingSiteRenderer } from "@/components/wedding-site-renderer";

interface WeddingWebsite {
  id: number;
  coupleId: number;
  slug: string;
  title: string;
  welcomeMessage: string;
  weddingDate: string | null;
  venue: string | null;
  city: string | null;
  programme: { time: string; event: string }[];
  coverImage: string | null;
  template: WeddingTemplateId | null;
  colorPrimary: string | null;
  colorBackground: string | null;
  fontHeading: WeddingFontHeading | null;
  active: boolean;
  rsvpEnabled: boolean;
}

const BASE_URL = import.meta.env.BASE_URL ?? "/";

export default function SiteMariagePage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: site, isLoading } = useQuery<WeddingWebsite | null>({
    queryKey: ["wedding-website"],
    queryFn: () => clientFetch<WeddingWebsite | null>("/api/client/wedding-website"),
  });

  const [form, setForm] = useState({
    slug: "",
    title: "",
    welcomeMessage: "",
    weddingDate: "",
    venue: "",
    city: "",
    active: false,
    rsvpEnabled: true,
    colorPrimary: "" as string,
    colorBackground: "" as string,
    fontHeading: "" as "" | WeddingFontHeading,
    coverImage: null as string | null,
  });
  const [programme, setProgramme] = useState<{ time: string; event: string }[]>([]);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (site) {
      setForm({
        slug: site.slug ?? "",
        title: site.title ?? "",
        welcomeMessage: site.welcomeMessage ?? "",
        weddingDate: site.weddingDate ?? "",
        venue: site.venue ?? "",
        city: site.city ?? "",
        active: site.active ?? false,
        rsvpEnabled: site.rsvpEnabled ?? true,
        colorPrimary: site.colorPrimary ?? "",
        colorBackground: site.colorBackground ?? "",
        fontHeading: (site.fontHeading ?? "") as "" | WeddingFontHeading,
        coverImage: site.coverImage ?? null,
      });
      setProgramme(site.programme ?? []);
    }
  }, [site]);

  const saveMutation = useMutation({
    mutationFn: () =>
      clientFetch<{ publishBlocked?: boolean }>("/api/client/wedding-website", {
        method: "PATCH",
        body: JSON.stringify({
          ...form,
          programme,
          colorPrimary: form.colorPrimary || null,
          colorBackground: form.colorBackground || null,
          fontHeading: form.fontHeading || null,
          coverImage: form.coverImage || null,
        }),
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["wedding-website"] });
      if (data.publishBlocked) {
        setForm((f) => ({ ...f, active: false }));
        toast({
          title: t("site_mariage.saved_not_published_toast", {
            defaultValue: "Enregistré. La publication attend la validation de votre compte par l'équipe Mariage Afro.",
          }),
        });
      } else {
        toast({ title: t("site_mariage.saved_toast") });
      }
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const templateMutation = useMutation({
    mutationFn: (template: WeddingTemplateId) =>
      clientFetch("/api/client/wedding-website", {
        method: "PATCH",
        body: JSON.stringify({ template }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wedding-website"] });
      toast({ title: t("site_mariage.template.selected_toast") });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  function addProgrammeRow() {
    setProgramme([...programme, { time: "", event: "" }]);
  }
  function updateProgramme(i: number, field: "time" | "event", val: string) {
    setProgramme(programme.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));
  }
  function removeProgramme(i: number) {
    setProgramme(programme.filter((_, idx) => idx !== i));
  }

  const publicUrl = site?.slug
    ? `${window.location.origin}${BASE_URL}mariage/${site.slug}`
    : null;

  const currentTemplate: WeddingTemplateId = normalizeTemplate(site?.template);
  const templateBtnsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const [previewTemplate, setPreviewTemplate] = useState<WeddingTemplateId | null>(null);

  const previewSite = {
    slug: form.slug || "preview",
    title: form.title || t("site_mariage.page_title_ph"),
    welcomeMessage: form.welcomeMessage,
    weddingDate: form.weddingDate || null,
    venue: form.venue || null,
    city: form.city || null,
    programme,
    rsvpEnabled: form.rsvpEnabled,
    colorPrimary: form.colorPrimary || null,
    colorBackground: form.colorBackground || null,
    fontHeading: form.fontHeading || null,
    coverImage: form.coverImage || null,
  };

  useEffect(() => {
    if (!publicUrl) { setQrDataUrl(null); return; }
    let cancelled = false;
    QRCode.toDataURL(publicUrl, { margin: 1, width: 240, color: { dark: resolveColor("--color-secondary"), light: resolveColor("--color-surface") } })
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => { if (!cancelled) setQrDataUrl(null); });
    return () => { cancelled = true; };
  }, [publicUrl]);

  async function copyPublicUrl() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  async function pickCover(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0];
    if (!raw) return;
    setCoverError(null);
    setCoverUploading(true);
    try {
      const { file, error } = await prepareImageForUpload(raw, {
        maxWidth: 1920, maxHeight: 1280, quality: 0.82, mimeType: "image/jpeg",
      });
      if (error) { setCoverError(error); return; }
      const { objectPath } = await clientProxyUpload(file);
      setForm((f) => ({ ...f, coverImage: objectPath }));
    } catch (err) {
      setCoverError((err as Error).message);
    } finally {
      setCoverUploading(false);
      if (coverFileRef.current) coverFileRef.current.value = "";
    }
  }

  function onTemplateKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = WEDDING_TEMPLATE_IDS.length - 1;
    let next = index;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = index === last ? 0 : index + 1;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = index === 0 ? last : index - 1;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      default:
        return;
    }
    e.preventDefault();
    const target = WEDDING_TEMPLATE_IDS[next];
    templateBtnsRef.current[next]?.focus();
    if (currentTemplate !== target) templateMutation.mutate(target);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold font-serif text-foreground">{t("site_mariage.title")}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("site_mariage.subtitle")}
          </p>
        </div>
        {publicUrl && (
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            {t("site_mariage.view_site")}
          </a>
        )}
      </div>

      {/* Share link + QR code */}
      {publicUrl && (
        <div
          className="bg-cream border border-border p-6 space-y-4"
          data-testid="share-block"
        >
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              {t("site_mariage.share.title")}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {t("site_mariage.share.help")}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="flex-1 space-y-2 min-w-0 w-full">
              <Label className="text-xs uppercase tracking-wider">
                {t("site_mariage.share.link_label")}
              </Label>
              <div className="flex items-stretch border border-border bg-muted/40">
                <input
                  readOnly
                  value={publicUrl}
                  className="flex-1 px-3 py-2 text-sm bg-transparent text-foreground truncate focus:outline-none"
                  data-testid="share-link-input"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  type="button"
                  onClick={copyPublicUrl}
                  className="px-4 border-l border-border bg-cream hover:bg-muted/50 text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2"
                  data-testid="button-copy-link"
                >
                  {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {linkCopied ? t("site_mariage.share.copied") : t("site_mariage.share.copy")}
                </button>
              </div>
            </div>
            {qrDataUrl && (
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="border border-border p-2 bg-cream">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt={site?.title
                      ? t("site_mariage.share.qr_alt", { title: site.title })
                      : t("site_mariage.share.qr_alt_generic")}
                    width={120}
                    height={120}
                    className="block"
                    data-testid="qr-code-image"
                  />
                </div>
                <a
                  href={qrDataUrl}
                  download={`mariage-${site?.slug ?? "qr"}.png`}
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  data-testid="qr-download"
                >
                  <QrCode className="w-3 h-3" />
                  {t("site_mariage.share.download_qr")}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Template gallery */}
      <div
        className="bg-cream border border-border p-6 space-y-5"
        data-testid="template-gallery"
      >
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            {t("site_mariage.template.title")}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {t("site_mariage.template.help")}
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label={t("site_mariage.template.title")}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {WEDDING_TEMPLATE_IDS.map((id, idx) => {
            const isSelected = currentTemplate === id;
            const isPending = templateMutation.isPending && templateMutation.variables === id;
            return (
              <div
                key={id}
                className={[
                  "relative border bg-cream transition-all",
                  isSelected
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/40",
                  templateMutation.isPending && !isSelected ? "opacity-60" : "",
                ].join(" ")}
              >
                {isSelected && (
                  <span
                    className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-1"
                    data-testid={`template-badge-${id}`}
                  >
                    <Check className="w-3 h-3" />
                    {t("site_mariage.template.selected_badge")}
                  </span>
                )}
                {isPending && (
                  <span className="absolute inset-0 z-20 flex items-center justify-center bg-cream/70">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </span>
                )}
                <button
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  ref={(el) => { templateBtnsRef.current[idx] = el; }}
                  onKeyDown={(e) => onTemplateKeyDown(e, idx)}
                  disabled={templateMutation.isPending}
                  onClick={() => {
                    if (!isSelected) templateMutation.mutate(id);
                  }}
                  data-testid={`template-card-${id}`}
                  data-selected={isSelected ? "true" : "false"}
                  className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="aspect-[3/2] w-full overflow-hidden bg-muted">
                    <TemplateThumbnail id={id} className="w-full h-full" />
                  </div>
                  <div className="px-3 pt-3">
                    <p className="text-sm font-semibold text-foreground">
                      {t(`site_mariage.template.items.${id}.name`)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">
                      {t(`site_mariage.template.items.${id}.desc`)}
                    </p>
                  </div>
                </button>
                <div className="px-3 pb-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPreviewTemplate(id)}
                    data-testid={`template-preview-${id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Search className="w-3.5 h-3.5" />
                    {t("site_mariage.template.preview")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Personnaliser */}
      <div
        className="bg-cream border border-border p-6 space-y-5"
        data-testid="customize-block"
      >
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            {t("site_mariage.customize.title")}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {t("site_mariage.customize.help")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="colorPrimary">{t("site_mariage.customize.color_primary")}</Label>
            <div className="flex items-center gap-2">
              <input
                id="colorPrimary"
                type="color"
                value={form.colorPrimary || resolveColor("--color-secondary")}
                onChange={(e) => setForm({ ...form, colorPrimary: e.target.value })}
                className="h-10 w-14 border border-border bg-cream cursor-pointer p-1"
                data-testid="input-color-primary"
              />
              <Input
                value={form.colorPrimary}
                onChange={(e) => setForm({ ...form, colorPrimary: e.target.value })}
                placeholder={t("site_mariage.customize.use_default")}
                className="rounded-none flex-1"
              />
              {form.colorPrimary && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, colorPrimary: "" })}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                  data-testid="reset-color-primary"
                >
                  {t("site_mariage.customize.reset")}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="colorBackground">{t("site_mariage.customize.color_background")}</Label>
            <div className="flex items-center gap-2">
              <input
                id="colorBackground"
                type="color"
                value={form.colorBackground || resolveColor("--color-cream-soft")}
                onChange={(e) => setForm({ ...form, colorBackground: e.target.value })}
                className="h-10 w-14 border border-border bg-cream cursor-pointer p-1"
                data-testid="input-color-background"
              />
              <Input
                value={form.colorBackground}
                onChange={(e) => setForm({ ...form, colorBackground: e.target.value })}
                placeholder={t("site_mariage.customize.use_default")}
                className="rounded-none flex-1"
              />
              {form.colorBackground && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, colorBackground: "" })}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                  data-testid="reset-color-background"
                >
                  {t("site_mariage.customize.reset")}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("site_mariage.customize.font_heading")}</Label>
          <div className="grid grid-cols-3 gap-2" role="radiogroup">
            {(["", ...WEDDING_FONT_HEADINGS] as Array<"" | WeddingFontHeading>).map((font) => {
              const isSelected = form.fontHeading === font;
              const fontStack =
                font === "serif"
                  ? "'Cormorant Garamond', serif"
                  : font === "sans"
                    ? "'Montserrat', sans-serif"
                    : font === "display"
                      ? "'Playfair Display', serif"
                      : undefined;
              return (
                <button
                  key={font || "default"}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setForm({ ...form, fontHeading: font })}
                  data-testid={`font-heading-${font || "default"}`}
                  className={[
                    "border p-3 text-left transition-colors",
                    isSelected
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/40",
                  ].join(" ")}
                >
                  <p className="text-lg" style={{ fontFamily: fontStack }}>
                    Aa
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t(`site_mariage.customize.fonts.${font || "default"}`)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Dialog
        open={previewTemplate !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewTemplate(null);
        }}
      >
        <DialogContent
          className="max-w-5xl w-[95vw] h-[90dvh] p-0 gap-0 overflow-hidden flex flex-col rounded-none"
          data-testid="template-preview-dialog"
        >
          <DialogHeader className="px-4 py-3 sm:px-6 sm:py-4 border-b border-border flex-shrink-0">
            <DialogTitle className="text-base font-bold uppercase tracking-wider">
              {previewTemplate
                ? t("site_mariage.template.preview_title", {
                    name: t(`site_mariage.template.items.${previewTemplate}.name`),
                  })
                : ""}
            </DialogTitle>
            <DialogDescription className="text-xs hidden sm:block">
              {t("site_mariage.template.preview_desc")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto bg-muted/40">
            {previewTemplate && (
              <WeddingSiteRenderer
                site={previewSite}
                template={previewTemplate}
                preview
              />
            )}
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-4 py-3 sm:px-6 sm:py-4 border-t border-border bg-cream flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-none"
              onClick={() => setPreviewTemplate(null)}
              data-testid="button-preview-close"
            >
              {t("site_mariage.template.close")}
            </Button>
            {previewTemplate && previewTemplate !== currentTemplate && (
              <Button
                type="button"
                className="rounded-none bg-primary hover:bg-primary/90"
                disabled={templateMutation.isPending}
                onClick={() => {
                  const target = previewTemplate;
                  templateMutation.mutate(target, {
                    onSuccess: () => setPreviewTemplate(null),
                  });
                }}
                data-testid="button-preview-apply"
              >
                {templateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {t("site_mariage.template.apply_this")}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Publication status */}
      <div className="bg-cream border border-border p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {form.active ? (
            <Eye className="w-5 h-5 text-gold-deep" />
          ) : (
            <EyeOff className="w-5 h-5 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium text-sm text-foreground">
              {form.active ? t("site_mariage.published") : t("site_mariage.private")}
            </p>
            <p className="text-xs text-muted-foreground">
              {form.active
                ? t("site_mariage.published_desc")
                : t("site_mariage.private_desc")}
            </p>
          </div>
        </div>
        <Switch
          checked={form.active}
          onCheckedChange={(v) => setForm({ ...form, active: v })}
        />
      </div>

      {/* Cover image */}
      <div
        className="bg-cream border border-border p-6 space-y-4"
        data-testid="cover-image-block"
      >
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            {t("site_mariage.cover.title")}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {t("site_mariage.cover.help")}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="w-full sm:w-64 aspect-[3/2] border border-border bg-muted/40 flex items-center justify-center overflow-hidden flex-shrink-0">
            {form.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImageDisplayUrl(form.coverImage) ?? ""}
                alt="cover"
                className="w-full h-full object-cover"
                data-testid="cover-preview"
              />
            ) : (
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {t("site_mariage.cover.empty")}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={coverFileRef}
              type="file"
              accept={ACCEPTED_IMAGE_ATTR}
              onChange={pickCover}
              className="hidden"
              data-testid="input-cover-file"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-none"
              disabled={coverUploading}
              onClick={() => coverFileRef.current?.click()}
              data-testid="button-cover-upload"
            >
              {coverUploading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {form.coverImage ? t("site_mariage.cover.replace") : t("site_mariage.cover.upload")}
            </Button>
            {form.coverImage && (
              <button
                type="button"
                onClick={() => setForm({ ...form, coverImage: null })}
                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 self-start"
                data-testid="button-cover-remove"
              >
                <X className="w-3 h-3" /> {t("site_mariage.cover.remove")}
              </button>
            )}
            {coverError && <p className="text-xs text-red-600">{coverError}</p>}
            <p className="text-xs text-muted-foreground max-w-xs">
              {t("site_mariage.cover.format")}
            </p>
          </div>
        </div>
      </div>

      {/* General info */}
      <div className="bg-cream border border-border p-6 space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
          {t("site_mariage.general_info")}
        </h2>

        <div className="space-y-2">
          <Label htmlFor="slug">{t("site_mariage.site_url")}</Label>
          <div className="flex items-center border border-border bg-muted/40 px-3 h-10 text-sm text-muted-foreground">
            <span>{t("site_mariage.slug_prefix")}</span>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) =>
                setForm({
                  ...form,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                })
              }
              placeholder={t("site_mariage.slug_placeholder")}
              className="border-0 bg-transparent h-auto p-0 pl-1 focus-visible:ring-0 text-foreground"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t("site_mariage.slug_help")}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">{t("site_mariage.page_title")}</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={t("site_mariage.page_title_ph")}
            className="rounded-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="msg">{t("site_mariage.welcome")}</Label>
          <Textarea
            id="msg"
            value={form.welcomeMessage}
            onChange={(e) => setForm({ ...form, welcomeMessage: e.target.value })}
            placeholder={t("site_mariage.welcome_ph")}
            rows={4}
            className="rounded-none resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>{t("site_mariage.wedding_date")}</Label>
            <Input
              type="date"
              value={form.weddingDate}
              onChange={(e) => setForm({ ...form, weddingDate: e.target.value })}
              className="rounded-none"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("site_mariage.venue")}</Label>
            <Input
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              placeholder={t("site_mariage.venue_ph")}
              className="rounded-none"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("site_mariage.city")}</Label>
            <Input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder={t("ui.city_placeholder")}
              className="rounded-none"
            />
          </div>
        </div>
      </div>

      {/* Programme */}
      <div className="bg-cream border border-border p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            {t("site_mariage.programme")}
          </h2>
          <Button variant="outline" size="sm" className="rounded-none" onClick={addProgrammeRow}>
            <Plus className="w-4 h-4 mr-1" /> {t("site_mariage.add")}
          </Button>
        </div>

        {programme.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border">
            {t("site_mariage.no_event")}
          </p>
        )}

        <div className="space-y-3">
          {programme.map((row, i) => (
            <div key={i} className="flex gap-3 items-center">
              <Input
                value={row.time}
                onChange={(e) => updateProgramme(i, "time", e.target.value)}
                placeholder="14:00"
                className="rounded-none w-28 flex-shrink-0"
              />
              <Input
                value={row.event}
                onChange={(e) => updateProgramme(i, "event", e.target.value)}
                placeholder={t("site_mariage.event_ph")}
                className="rounded-none flex-1"
              />
              <button
                onClick={() => removeProgramme(i)}
                className="text-muted-foreground hover:text-destructive transition-colors p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* RSVP */}
      <div className="bg-cream border border-border p-5 flex items-center justify-between">
        <div>
          <p className="font-medium text-sm text-foreground">{t("site_mariage.rsvp_form")}</p>
          <p className="text-xs text-muted-foreground">
            {t("site_mariage.rsvp_form_desc")}
          </p>
        </div>
        <Switch
          checked={form.rsvpEnabled}
          onCheckedChange={(v) => setForm({ ...form, rsvpEnabled: v })}
        />
      </div>

      {/* Save */}
      <Button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="w-full rounded-none bg-primary hover:bg-primary/90 h-12 text-sm font-bold uppercase tracking-wider"
      >
        {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        {t("site_mariage.save")}
      </Button>
    </div>
  );
}
