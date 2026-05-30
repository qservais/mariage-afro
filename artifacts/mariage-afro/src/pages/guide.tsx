import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import {
  Heart, Users, Briefcase, Shield, Sparkles, Calendar, Wallet,
  Mail, Image as ImageIcon, Gift, MessageSquare, MapPin, Globe,
  CheckCircle2, ArrowRight, Search, Star, Clock, FileText,
  Settings, BarChart3, ShoppingBag, Camera, ClipboardList, Bell,
} from "lucide-react";

type Section = {
  id: string;
  icon: typeof Heart;
  title: string;
  steps: { t: string; d: string; link?: { to: string; label: string } }[];
};

const COUPLE_SECTIONS: Section[] = [
  {
    id: "compte", icon: Users, title: "1. Créer votre compte couple",
    steps: [
      { t: "Inscription", d: "Cliquez sur Espace Client puis Créer un compte. Email + mot de passe ou Google.", link: { to: "/espace-client/register", label: "Créer mon compte" } },
      { t: "Profil du couple", d: "Renseignez vos prénoms, la date du mariage, le lieu et votre langue (FR/NL/EN)." },
      { t: "Onboarding guidé", d: "Un assistant en 4 étapes vous oriente vers les premiers outils utiles." },
    ],
  },
  {
    id: "site", icon: Globe, title: "2. Votre site mariage personnalisé",
    steps: [
      { t: "Choisir un slug", d: "Votre URL sera www.mariage-afro.com/mariage/votre-slug, partageable avec vos invités." },
      { t: "Personnaliser le contenu", d: "Photo de couverture, histoire, programme de la journée, infos pratiques, dress code." },
      { t: "Activer le RSVP", d: "Cochez « activer RSVP » pour permettre aux invités de confirmer leur présence." },
      { t: "Publier en 1 clic", d: "Le site devient visible immédiatement à l'URL choisie." },
    ],
  },
  {
    id: "invites", icon: Mail, title: "3. Liste d'invités & RSVP",
    steps: [
      { t: "Ajouter vos invités", d: "Saisie manuelle ou import CSV (prénom, nom, côté, table)." },
      { t: "Questions personnalisées", d: "Ajoutez vos propres questions au RSVP : régime alimentaire, allergies, transport, etc. Réordonnez avec les flèches." },
      { t: "Suivre les réponses", d: "Tableau de bord : présents, absents, total invités. Filtres + export CSV." },
    ],
  },
  {
    id: "budget", icon: Wallet, title: "4. Budget & dépenses",
    steps: [
      { t: "Définir votre enveloppe globale", d: "Indiquez le budget total et répartissez par catégorie (lieu, traiteur, photo…)." },
      { t: "Ajouter des dépenses", d: "Chaque dépense liée à un prestataire ou une catégorie. Reste-à-payer calculé automatiquement." },
      { t: "Suivi visuel", d: "Graphique de répartition + alertes si dépassement." },
    ],
  },
  {
    id: "planning", icon: Calendar, title: "5. Planning & jour J",
    steps: [
      { t: "Rétroplanning", d: "Étapes pré-générées (12 mois avant, 6 mois avant…) à cocher au fur et à mesure." },
      { t: "Timeline du jour J", d: "Programme heure par heure partageable avec les prestataires." },
    ],
  },
  {
    id: "plan", icon: MapPin, title: "6. Plan de table",
    steps: [
      { t: "Créer vos tables", d: "Glissez-déposez vos invités sur les tables." },
      { t: "Visuel imprimable", d: "Export PDF du plan de salle pour le jour J." },
    ],
  },
  {
    id: "inspiration", icon: ImageIcon, title: "7. Mood board & inspiration",
    steps: [
      { t: "Créer plusieurs tableaux", d: "Décor, robe, fleurs, gâteau… organisez vos inspirations." },
      { t: "Importer vos images", d: "Glissez-déposez photos, ajoutez une légende, réorganisez." },
      { t: "Inviter vos proches", d: "Partagez un lien à votre wedding planner ou demoiselle d'honneur (lecture ou édition).", link: { to: "/espace-client/inspiration", label: "Mon inspiration" } },
    ],
  },
  {
    id: "cagnotte", icon: Gift, title: "8. Cagnotte & liste de mariage",
    steps: [
      { t: "Créer une cagnotte", d: "Photo, titre, description et IBAN ou lien externe (Lyf, Leetchi, etc.)." },
      { t: "QR code IBAN", d: "Vos invités scannent le QR code EPC pour virer en 1 clic depuis leur appli bancaire." },
      { t: "Page publique dédiée", d: "Lien depuis votre site mariage : /mariage/votre-slug/cagnotte." },
    ],
  },
  {
    id: "prestataires", icon: Briefcase, title: "9. Trouver vos prestataires",
    steps: [
      { t: "Rechercher", d: "Filtres par catégorie, ville, prix, disponibilité, communauté.", link: { to: "/partenaires", label: "Voir les prestataires" } },
      { t: "Comparer", d: "Outil comparateur 2 à 4 prestataires côte à côte (tarifs, services, avis)." },
      { t: "Demander un devis", d: "Formulaire de contact qui crée un lead chez le prestataire et déclenche un email." },
      { t: "Messagerie intégrée", d: "Conversation sécurisée avec chaque prestataire depuis votre espace." },
    ],
  },
  {
    id: "outils", icon: Sparkles, title: "10. Outils gratuits",
    steps: [
      { t: "Calculateur de budget", d: "Estimation rapide selon nombre d'invités et niveau de prestation.", link: { to: "/outils/budget", label: "Lancer" } },
      { t: "Quiz style mariage", d: "Découvrez votre univers en 10 questions.", link: { to: "/outils/quiz", label: "Faire le quiz" } },
    ],
  },
];

const VENDOR_SECTIONS: Section[] = [
  {
    id: "v-compte", icon: Briefcase, title: "1. Créer votre compte pro",
    steps: [
      { t: "Inscription pro", d: "Espace Pro → Créer un compte. Renseignez votre nom commercial et catégorie.", link: { to: "/espace-pro/register", label: "Créer mon compte pro" } },
      { t: "Validation", d: "Votre profil est en mode brouillon le temps que vous le complétiez." },
    ],
  },
  {
    id: "v-profil", icon: Settings, title: "2. Compléter votre profil",
    steps: [
      { t: "Identité visuelle", d: "Logo, photo de couverture, description en FR/NL/EN, valeurs, expérience." },
      { t: "Zone de couverture", d: "Provinces ou rayon en km autour de votre adresse." },
      { t: "Réseaux & site web", d: "Instagram, site, téléphone, email pro." },
    ],
  },
  {
    id: "v-galerie", icon: Camera, title: "3. Galerie & portfolio",
    steps: [
      { t: "Importer vos photos", d: "Multi-upload, titre/légende, classement par albums." },
      { t: "Mise en avant", d: "Désignez 3 photos « hero » pour la fiche publique." },
    ],
  },
  {
    id: "v-services", icon: ShoppingBag, title: "4. Services & tarifs",
    steps: [
      { t: "Créer vos formules", d: "Nom, description, prix de base, options, durée." },
      { t: "Affichage public", d: "Vos services apparaissent sur votre fiche et dans le comparateur." },
    ],
  },
  {
    id: "v-agenda", icon: Calendar, title: "5. Agenda & disponibilités",
    steps: [
      { t: "Bloquer des dates", d: "Marquez les jours indisponibles ou réservés." },
      { t: "Affichage côté couple", d: "Les couples voient en direct vos prochaines disponibilités." },
    ],
  },
  {
    id: "v-leads", icon: ClipboardList, title: "6. Demandes & devis (leads)",
    steps: [
      { t: "Boîte de réception", d: "Toutes les demandes des couples centralisées avec statut." },
      { t: "Notifications email", d: "Alerte instantanée à chaque nouvelle demande." },
      { t: "Suivi", d: "Statuts personnalisables : nouveau, en discussion, devis envoyé, gagné, perdu." },
    ],
  },
  {
    id: "v-msg", icon: MessageSquare, title: "7. Messagerie",
    steps: [
      { t: "Conversations", d: "Échangez directement avec chaque couple, pièces jointes possibles." },
      { t: "Historique", d: "Tout est archivé et consultable à tout moment." },
    ],
  },
  {
    id: "v-stats", icon: BarChart3, title: "8. Statistiques",
    steps: [
      { t: "Vues fiche", d: "Nombre de vues, demandes reçues, taux de conversion." },
      { t: "Avis clients", d: "Notes et témoignages collectés après mariage." },
    ],
  },
  {
    id: "v-abo", icon: Star, title: "9. Abonnement & visibilité",
    steps: [
      { t: "Formules", d: "Gratuit (fiche basique) ou Premium (mise en avant, plus de photos, comparateur prioritaire)." },
      { t: "Gestion", d: "Activez/désactivez votre abonnement à tout moment." },
    ],
  },
];

const ADMIN_SECTIONS: Section[] = [
  {
    id: "a-mod", icon: Shield, title: "1. Modération",
    steps: [
      { t: "Validation des fiches pro", d: "Approbation manuelle des nouveaux prestataires avant publication." },
      { t: "Modération avis", d: "Suppression des avis abusifs ou non conformes." },
    ],
  },
  {
    id: "a-content", icon: FileText, title: "2. Contenus éditoriaux",
    steps: [
      { t: "Articles & réalisations", d: "Publication des reportages mariages réels avec galerie." },
      { t: "Pages statiques", d: "À propos, services, conditions, mentions légales (FR/NL/EN)." },
    ],
  },
  {
    id: "a-notif", icon: Bell, title: "3. Notifications & emails",
    steps: [
      { t: "Templates Resend", d: "Tous les emails transactionnels (RSVP, leads, invitations, mood board) sont multilingues." },
      { t: "Suivi des envois", d: "Logs d'envoi consultables côté serveur." },
    ],
  },
  {
    id: "a-data", icon: BarChart3, title: "4. Analytics plateforme",
    steps: [
      { t: "Vue d'ensemble", d: "Couples actifs, prestataires inscrits, leads/mois, taux de conversion." },
      { t: "Export", d: "Données exportables pour analyse externe." },
    ],
  },
];

function SectionCard({ s }: { s: Section }) {
  const Icon = s.icon;
  return (
    <article id={s.id} className="bg-cream border border-border p-6 md:p-8 scroll-mt-24">
      <header className="flex items-start gap-4 mb-5 pb-5 border-b border-border">
        <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="font-serif text-xl md:text-2xl text-foreground">{s.title}</h3>
      </header>
      <ol className="space-y-4">
        {s.steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="text-xs font-bold text-primary mt-1 shrink-0 w-5">{String(i + 1).padStart(2, "0")}</span>
            <div className="space-y-1.5">
              <p className="font-semibold text-sm text-foreground">{step.t}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.d}</p>
              {step.link && (
                <Link to={step.link.to} className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-primary hover:underline mt-1">
                  {step.link.label} <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}

function Toc({ sections, color }: { sections: Section[]; color: string }) {
  return (
    <ul className="grid sm:grid-cols-2 gap-2 text-sm">
      {sections.map((s) => (
        <li key={s.id}>
          <a href={`#${s.id}`} className={`${color} hover:underline flex items-start gap-2`}>
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 opacity-60" /> {s.title}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function GuidePage() {
  return (
    <div className="bg-cream-soft">
      <SEO title="Guide complet — Mariage Afro" description="Le guide complet pour utiliser Mariage Afro côté couple et côté prestataire : marketplace, espace client, site mariage, outils, abonnements." />
      {/* Hero */}
      <section className="bg-foreground text-cream py-20 px-6 text-center">
        <p className="uppercase tracking-[0.4em] text-xs text-gold mb-4">Guide pratique</p>
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-5 max-w-4xl mx-auto">
          Tout ce que vous pouvez faire sur Mariage Afro
        </h1>
        <p className="text-cream/70 max-w-2xl mx-auto leading-relaxed">
          Le tutoriel complet de la plateforme : couples, prestataires et coulisses administratives.
          Cliquez sur une section pour y accéder directement.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <a href="#couples" className="border border-cream/30 px-6 py-2.5 text-xs uppercase tracking-widest hover:bg-cream hover:text-foreground transition-colors">
            <Heart className="inline w-3.5 h-3.5 mr-2" /> Couples
          </a>
          <a href="#prestataires" className="border border-cream/30 px-6 py-2.5 text-xs uppercase tracking-widest hover:bg-cream hover:text-foreground transition-colors">
            <Briefcase className="inline w-3.5 h-3.5 mr-2" /> Prestataires
          </a>
          <a href="#admin" className="border border-cream/30 px-6 py-2.5 text-xs uppercase tracking-widest hover:bg-cream hover:text-foreground transition-colors">
            <Shield className="inline w-3.5 h-3.5 mr-2" /> Admin
          </a>
        </div>
      </section>

      {/* Quick start */}
      <section className="container max-w-5xl mx-auto py-14 px-6">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { i: Search, t: "Découvrez", d: "Parcourez prestataires, lieux, réalisations et inspirations." },
            { i: Clock, t: "Organisez", d: "Espace Client : budget, planning, RSVP, mood board, plan de table." },
            { i: Sparkles, t: "Célébrez", d: "Site mariage, cagnotte et messagerie pour partager le grand jour." },
          ].map((b) => (
            <div key={b.t} className="bg-cream border border-border p-6 text-center">
              <b.i className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-serif text-lg mb-2">{b.t}</h3>
              <p className="text-sm text-muted-foreground">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COUPLES */}
      <section id="couples" className="container max-w-5xl mx-auto py-14 px-6 scroll-mt-20">
        <div className="text-center mb-10">
          <p className="uppercase tracking-[0.3em] text-xs text-primary mb-3">Pour les futurs mariés</p>
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
            <Heart className="inline w-7 h-7 text-primary mr-2 -mt-1" /> Espace Client (B2C)
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tout ce qu'il vous faut pour organiser votre mariage de A à Z, en 10 modules connectés.
          </p>
        </div>
        <div className="bg-cream/50 border border-border p-6 mb-10">
          <p className="text-xs uppercase tracking-widest text-primary mb-3">Sommaire</p>
          <Toc sections={COUPLE_SECTIONS} color="text-foreground" />
        </div>
        <div className="space-y-6">
          {COUPLE_SECTIONS.map((s) => <SectionCard key={s.id} s={s} />)}
        </div>
      </section>

      {/* VENDORS */}
      <section id="prestataires" className="bg-cream/40 border-y border-border py-14 px-6 scroll-mt-20">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="uppercase tracking-[0.3em] text-xs text-primary mb-3">Pour les prestataires</p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              <Briefcase className="inline w-7 h-7 text-primary mr-2 -mt-1" /> Espace Pro (B2B)
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Développez votre activité auprès des couples afro & mixtes en Belgique.
            </p>
          </div>
          <div className="bg-cream border border-border p-6 mb-10">
            <p className="text-xs uppercase tracking-widest text-primary mb-3">Sommaire</p>
            <Toc sections={VENDOR_SECTIONS} color="text-foreground" />
          </div>
          <div className="space-y-6">
            {VENDOR_SECTIONS.map((s) => <SectionCard key={s.id} s={s} />)}
          </div>
        </div>
      </section>

      {/* ADMIN */}
      <section id="admin" className="container max-w-5xl mx-auto py-14 px-6 scroll-mt-20">
        <div className="text-center mb-10">
          <p className="uppercase tracking-[0.3em] text-xs text-primary mb-3">Coulisses</p>
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
            <Shield className="inline w-7 h-7 text-primary mr-2 -mt-1" /> Administration
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Outils internes assurant la qualité éditoriale et le bon fonctionnement de la plateforme.
          </p>
        </div>
        <div className="bg-cream/50 border border-border p-6 mb-10">
          <p className="text-xs uppercase tracking-widest text-primary mb-3">Sommaire</p>
          <Toc sections={ADMIN_SECTIONS} color="text-foreground" />
        </div>
        <div className="space-y-6">
          {ADMIN_SECTIONS.map((s) => <SectionCard key={s.id} s={s} />)}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-foreground text-cream py-16 px-6 text-center">
        <h2 className="font-serif text-3xl md:text-4xl mb-5">Prêt à commencer&nbsp;?</h2>
        <p className="text-cream/70 max-w-xl mx-auto mb-8">
          Créez votre compte en 2 minutes ou inscrivez votre activité auprès des futurs mariés.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/espace-client/register" className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-xs uppercase tracking-widest font-bold inline-flex items-center gap-2">
            <Heart className="w-4 h-4" /> Espace Client
          </Link>
          <Link to="/espace-pro/register" className="border border-cream/30 hover:bg-cream hover:text-foreground px-8 py-3 text-xs uppercase tracking-widest font-bold inline-flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Espace Pro
          </Link>
          <Link to="/contact" className="border border-cream/30 hover:bg-cream hover:text-foreground px-8 py-3 text-xs uppercase tracking-widest font-bold inline-flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Nous contacter
          </Link>
        </div>
      </section>
    </div>
  );
}
