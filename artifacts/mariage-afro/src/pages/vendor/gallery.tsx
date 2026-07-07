import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { UploadCloud, Trash2, Star, StarOff, Loader2 } from "lucide-react";
import { vendorApi, proxyUpload } from "@/lib/vendorApi";
import { storageUrl } from "@/lib/storage-url";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface VendorProfile {
  id: number;
  images: string[];
  coverImage: string | null;
}

const displayUrl = (url: string) => storageUrl(url) ?? url;

export default function VendorGalleryPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: vendor } = useQuery<VendorProfile>({
    queryKey: ["vendor", "profile"],
    queryFn: () => vendorApi.get<VendorProfile>("/api/vendor/profile"),
  });

  const [images, setImages] = useState<string[]>([]);
  const [cover, setCover] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setImages(vendor?.images ?? []);
    setCover(vendor?.coverImage ?? null);
  }, [vendor]);

  const save = useMutation({
    mutationFn: (b: { images: string[]; coverImage: string | null }) =>
      vendorApi.patch<VendorProfile>("/api/vendor/profile/images", b),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["vendor", "profile"] });
      setImages(data.images);
      setCover(data.coverImage);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({ title: t("vendor.gallery.saved") });
    },
    onError: () => toast({ title: t("vendor.gallery.save_error", { defaultValue: "Impossible d'enregistrer la galerie" }), variant: "destructive" }),
  });

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-wine-deep">{t("vendor.gallery.title")}</h2>
        <p className="text-sm text-neutral-600 mt-1">{t("vendor.gallery.subtitle")}</p>
      </div>

      <div className="bg-cream border border-neutral-200 p-6 space-y-5">
        {images.length === 0 && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-3">
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>{t("vendor.gallery.no_cover_warning", { defaultValue: "Votre profil est moins visible sans photo de couverture. Ajoutez au moins une photo." })}</span>
          </div>
        )}
        <div>
          <label
            data-testid="button-upload-gallery"
            className="inline-flex items-center gap-2 bg-wine-deep text-cream hover:bg-wine-deep/90 cursor-pointer uppercase tracking-wider text-xs h-10 px-4"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <UploadCloud className="w-4 h-4" aria-hidden="true" />}
            {t("vendor.gallery.upload")}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={async (e) => {
                const files = e.target.files;
                if (!files || files.length === 0) return;
                const remaining = 10 - images.length;
                if (remaining <= 0) {
                  setUploadError(t("vendor.gallery.max_reached"));
                  return;
                }
                setUploadError(null);
                setUploading(true);
                try {
                  const newPaths: string[] = [];
                  const toUpload = Array.from(files).slice(0, remaining);
                  for (const file of toUpload) {
                    const { objectPath } = await proxyUpload(file);
                    newPaths.push(objectPath);
                  }
                  if (newPaths.length === 0) return;
                  const next = [...images, ...newPaths];
                  await save.mutateAsync({ images: next, coverImage: cover ?? newPaths[0] });
                } catch (err) {
                  setUploadError((err as Error).message);
                } finally {
                  setUploading(false);
                  if (galleryInputRef.current) galleryInputRef.current.value = "";
                }
              }}
            />
          </label>
          {uploadError && <p className="text-[11px] text-red-600 mt-2">{uploadError}</p>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4" data-testid="grid-vendor-gallery">
          {images.length === 0 && (
            <p className="col-span-full text-sm text-neutral-500 italic py-8 text-center">
              {t("vendor.gallery.empty")}
            </p>
          )}
          {images.map((img, idx) => {
            const isCover = img === cover;
            return (
              <div key={img + idx} className="relative group border border-neutral-200">
                <img
                  src={displayUrl(img)}
                  alt={`Image ${idx + 1}`}
                  className="w-full h-40 object-cover"
                  data-testid={`image-vendor-gallery-${idx}`}
                />
                {isCover && (
                  <span className="absolute top-2 left-2 bg-gold text-wine-deep text-[10px] uppercase tracking-widest px-2 py-0.5">
                    {t("vendor.gallery.cover_badge")}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 group-focus-within:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={() => {
                      const nextCover = isCover ? null : img;
                      setCover(nextCover);
                      save.mutate({ images, coverImage: nextCover });
                    }}
                    className="bg-cream/90 hover:bg-cream p-2"
                    aria-label={isCover ? t("vendor.gallery.unset_cover") : t("vendor.gallery.set_cover")}
                    data-testid={`button-cover-${idx}`}
                  >
                    {isCover ? <StarOff className="w-4 h-4" aria-hidden="true" /> : <Star className="w-4 h-4" aria-hidden="true" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = images.filter((_, i) => i !== idx);
                      const nextCover = cover === img ? (next[0] ?? null) : cover;
                      setImages(next);
                      setCover(nextCover);
                      save.mutate({ images: next, coverImage: nextCover });
                    }}
                    className="bg-cream/90 hover:bg-cream p-2 text-wine-deep"
                    aria-label={t("vendor.gallery.remove")}
                    data-testid={`button-remove-${idx}`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {saved && <p className="text-sm text-gold-deep">{t("vendor.gallery.saved")}</p>}
        {save.isError && <p className="text-sm text-red-600">{(save.error as Error).message}</p>}
      </div>
    </div>
  );
}
