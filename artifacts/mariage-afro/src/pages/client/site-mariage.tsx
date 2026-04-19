import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Globe, Eye, EyeOff, Plus, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { clientFetch } from "@/lib/clientApi";

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
  active: boolean;
  rsvpEnabled: boolean;
}

const BASE_URL = import.meta.env.BASE_URL ?? "/";

export default function SiteMariagePage() {
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
  });
  const [programme, setProgramme] = useState<{ time: string; event: string }[]>([]);

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
      });
      setProgramme(site.programme ?? []);
    }
  }, [site]);

  const saveMutation = useMutation({
    mutationFn: () =>
      clientFetch("/api/client/wedding-website", {
        method: "PATCH",
        body: JSON.stringify({ ...form, programme }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wedding-website"] });
      toast({ title: "Site mariage sauvegardé !" });
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
            <h1 className="text-2xl font-bold font-serif text-foreground">Mon site mariage</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Créez votre page dédiée avec programme, RSVP et message de bienvenue.
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
            Voir le site
          </a>
        )}
      </div>

      {/* Publication status */}
      <div className="bg-white border border-border p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {form.active ? (
            <Eye className="w-5 h-5 text-emerald-600" />
          ) : (
            <EyeOff className="w-5 h-5 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium text-sm text-foreground">
              {form.active ? "Site publié" : "Site privé"}
            </p>
            <p className="text-xs text-muted-foreground">
              {form.active
                ? "Vos invités peuvent accéder à votre site."
                : "Le site est invisible pour vos invités."}
            </p>
          </div>
        </div>
        <Switch
          checked={form.active}
          onCheckedChange={(v) => setForm({ ...form, active: v })}
        />
      </div>

      {/* General info */}
      <div className="bg-white border border-border p-6 space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
          Informations générales
        </h2>

        <div className="space-y-2">
          <Label htmlFor="slug">Adresse du site (URL)</Label>
          <div className="flex items-center border border-border bg-muted/40 px-3 h-10 text-sm text-muted-foreground">
            <span>…/mariage/</span>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) =>
                setForm({
                  ...form,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                })
              }
              placeholder="prenom-prenom-2025"
              className="border-0 bg-transparent h-auto p-0 pl-1 focus-visible:ring-0 text-foreground"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Uniquement lettres minuscules, chiffres et tirets.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Titre de la page</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Notre Mariage"
            className="rounded-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="msg">Message de bienvenue</Label>
          <Textarea
            id="msg"
            value={form.welcomeMessage}
            onChange={(e) => setForm({ ...form, welcomeMessage: e.target.value })}
            placeholder="Chers amis et famille, nous sommes heureux de vous inviter…"
            rows={4}
            className="rounded-none resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Date du mariage</Label>
            <Input
              type="date"
              value={form.weddingDate}
              onChange={(e) => setForm({ ...form, weddingDate: e.target.value })}
              className="rounded-none"
            />
          </div>
          <div className="space-y-2">
            <Label>Lieu de la cérémonie</Label>
            <Input
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              placeholder="Château de la Forêt"
              className="rounded-none"
            />
          </div>
          <div className="space-y-2">
            <Label>Ville</Label>
            <Input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Bruxelles"
              className="rounded-none"
            />
          </div>
        </div>
      </div>

      {/* Programme */}
      <div className="bg-white border border-border p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Programme de la journée
          </h2>
          <Button variant="outline" size="sm" className="rounded-none" onClick={addProgrammeRow}>
            <Plus className="w-4 h-4 mr-1" /> Ajouter
          </Button>
        </div>

        {programme.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border">
            Aucun événement. Cliquez sur "Ajouter" pour créer votre programme.
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
                placeholder="Cérémonie civile"
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
      <div className="bg-white border border-border p-5 flex items-center justify-between">
        <div>
          <p className="font-medium text-sm text-foreground">Formulaire RSVP</p>
          <p className="text-xs text-muted-foreground">
            Vos invités pourront confirmer leur présence directement sur votre site.
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
        Enregistrer les modifications
      </Button>
    </div>
  );
}
