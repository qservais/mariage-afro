import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { UploadCloud, Trash2, Star, StarOff, Loader2 } from "lucide-react";
import { vendorApi, proxyUpload } from "@/lib/vendorApi";
import { Button } from "@/components/ui/button";

interface VendorProfile {
  id: number;
  images: string[];
  coverImage: string | null;
}

const isStoredObject = (url: string) => url.startsWith("/objects/");
const displayUrl = (url: string) => (isStoredObject(url) ? `/api/storage${url}` : url);

export default function VendorGalleryPage() {
  const { t } = useTranslation();
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
    },
  });

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-wine-deep">{t("vendor.gallery.title")}</h2>
        <p className="text-sm text-neutral-600 mt-1">{t("vendor.gallery.subtitle")}</p>
      </div>

      <div className="bg-white border border-neutral-200 p-6 space-y-5">
        <div>
          <label
            data-testid="button-upload-gallery"
            className="inline-flex items-center gap-2 bg-wine-deep text-cream hover:bg-wine-deep/90 cursor-pointer uppercase tracking-wider text-xs h-10 px-4"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
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
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => {
                      const nextCover = isCover ? null : img;
                      setCover(nextCover);
                      save.mutate({ images, coverImage: nextCover });
                    }}
                    className="bg-white/90 hover:bg-white p-2"
                    aria-label={isCover ? t("vendor.gallery.unset_cover") : t("vendor.gallery.set_cover")}
                    data-testid={`button-cover-${idx}`}
                  >
                    {isCover ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
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
                    className="bg-white/90 hover:bg-white p-2 text-red-600"
                    aria-label={t("vendor.gallery.remove")}
                    data-testid={`button-remove-${idx}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {saved && <p className="text-sm text-emerald-700">{t("vendor.gallery.saved")}</p>}
        {save.isError && <p className="text-sm text-red-600">{(save.error as Error).message}</p>}
      </div>
    </div>
  );
}
