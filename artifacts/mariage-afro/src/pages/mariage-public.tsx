import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Heart, Loader2 } from "lucide-react";
import {
  WeddingSiteRenderer,
  type WeddingSiteData,
} from "@/components/wedding-site-renderer";

interface WeddingWebsite extends WeddingSiteData {
  id: number;
  template?: string | null;
  active: boolean;
}

export default function MariagePublicPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();

  const { data: site, isLoading, isError } = useQuery<WeddingWebsite>({
    queryKey: ["wedding-public", slug],
    queryFn: async () => {
      const res = await fetch(`/api/wedding/${slug}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (site) document.title = `${site.title} — Mariage Afro`;
  }, [site]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !site) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
        <Heart className="w-16 h-16 text-primary/30" />
        <h1 className="text-2xl font-bold font-serif text-foreground">
          {t("mariage_public.not_found_title")}
        </h1>
        <p className="text-muted-foreground max-w-xs">
          {t("mariage_public.not_found_desc")}
        </p>
        <Link to="/" className="text-primary hover:underline text-sm">
          {t("mariage_public.back_home")}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <WeddingSiteRenderer site={site} template={site.template} />
    </div>
  );
}
