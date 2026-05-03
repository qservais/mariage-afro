import { useEffect } from "react";

const SCREENS_BASE = `${import.meta.env.BASE_URL}guide-screens/`;

const COLORS = {
  bordeaux: "#68191e",
  bordeauxLight: "#8a2329",
  cream: "#fff4e4",
  creamSoft: "#faf0dc",
  gold: "#c9a96e",
  goldDeep: "#8a6d3b",
  wineDeep: "#1f1416",
  ink: "#2b1a1c",
  muted: "#6b5a4f",
  line: "rgba(104, 25, 30, 0.12)",
};

interface FeatureCardProps {
  num?: string;
  route?: string;
  title: string;
  pill?: string;
  pillVariant?: "gold" | "alt";
  bullets?: string[];
  text?: string;
  screenshot?: string;
  screenshotAlt?: string;
}

function FeatureCard({ num, route, title, pill, pillVariant = "gold", bullets, text, screenshot, screenshotAlt }: FeatureCardProps) {
  return (
    <article
      style={{
        background: "#fff",
        border: `1px solid ${COLORS.line}`,
        borderRadius: 4,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {screenshot && (
        <div style={{ background: COLORS.creamSoft, borderBottom: `1px solid ${COLORS.line}` }}>
          <img
            src={screenshot}
            alt={screenshotAlt || title}
            loading="lazy"
            style={{ width: "100%", display: "block", aspectRatio: "16/9", objectFit: "cover", objectPosition: "top" }}
          />
        </div>
      )}
      <div style={{ padding: "1.6rem 1.6rem 1.8rem" }}>
        {num && (
          <span
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: "italic",
              color: COLORS.gold,
              fontSize: "1rem",
              display: "block",
              marginBottom: ".5rem",
            }}
          >
            {num}
          </span>
        )}
        {route && (
          <code
            style={{
              display: "inline-block",
              fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
              fontSize: ".72rem",
              background: COLORS.cream,
              color: COLORS.bordeaux,
              padding: ".2rem .55rem",
              borderRadius: 2,
              marginBottom: ".7em",
              border: `1px solid ${COLORS.line}`,
            }}
          >
            {route}
          </code>
        )}
        <h3
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 500,
            fontSize: "1.4rem",
            color: COLORS.bordeaux,
            marginBottom: ".5em",
            lineHeight: 1.2,
          }}
        >
          {title}
          {pill && (
            <span
              style={{
                display: "inline-block",
                fontFamily: "'Montserrat', sans-serif",
                fontSize: ".62rem",
                fontWeight: 600,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                padding: ".25rem .65rem",
                borderRadius: 999,
                background: pillVariant === "alt" ? COLORS.bordeaux : COLORS.gold,
                color: pillVariant === "alt" ? COLORS.cream : COLORS.wineDeep,
                marginLeft: ".7em",
                verticalAlign: "middle",
              }}
            >
              {pill}
            </span>
          )}
        </h3>
        {text && <p style={{ color: COLORS.muted, fontSize: ".92rem", margin: 0 }}>{text}</p>}
        {bullets && (
          <ul style={{ listStyle: "none", margin: ".5em 0 0", padding: 0 }}>
            {bullets.map((b, i) => (
              <li
                key={i}
                style={{
                  padding: ".35rem 0 .35rem 1.2rem",
                  position: "relative",
                  fontSize: ".88rem",
                  color: COLORS.ink,
                  lineHeight: 1.55,
                }}
              >
                <span
                  style={{
                    content: "''",
                    color: COLORS.gold,
                    position: "absolute",
                    left: 0,
                    fontSize: "1.4rem",
                    lineHeight: 1,
                    top: ".3rem",
                  }}
                >
                  ·
                </span>
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

function SectionHead({ eyebrow, title, intro }: { eyebrow: string; title: string; intro: string }) {
  return (
    <div style={{ marginBottom: "3rem", maxWidth: 720 }}>
      <span
        style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: ".72rem",
          fontWeight: 600,
          letterSpacing: ".25em",
          textTransform: "uppercase",
          color: COLORS.goldDeep,
          marginBottom: "1em",
          display: "block",
        }}
      >
        {eyebrow}
      </span>
      <h2
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontWeight: 500,
          fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
          color: COLORS.bordeaux,
          marginBottom: ".4em",
          lineHeight: 1.2,
        }}
      >
        {title}
      </h2>
      <p style={{ color: COLORS.muted, fontSize: "1.05rem", lineHeight: 1.65 }}>{intro}</p>
    </div>
  );
}

function Banner({ title, text }: { title: string; text: string }) {
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${COLORS.bordeaux} 0%, ${COLORS.bordeauxLight} 100%)`,
        color: COLORS.cream,
        padding: "2.5rem 2rem",
        borderRadius: 6,
        margin: "3rem 0",
        textAlign: "center",
      }}
    >
      <h3
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          color: COLORS.gold,
          fontSize: "1.5rem",
          marginBottom: ".5em",
        }}
      >
        {title}
      </h3>
      <p style={{ opacity: 0.9, maxWidth: 600, margin: "0 auto", lineHeight: 1.65 }}>{text}</p>
    </div>
  );
}

interface FlowStep { num: number; title: string; text: string; }
function FlowGrid({ steps }: { steps: FlowStep[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "1rem",
        margin: "2rem 0",
      }}
    >
      {steps.map((s) => (
        <div
          key={s.num}
          style={{
            textAlign: "center",
            padding: "1.5rem 1rem",
            background: "#fff",
            border: `1px solid ${COLORS.line}`,
            borderRadius: 4,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              width: 32,
              height: 32,
              background: COLORS.bordeaux,
              color: COLORS.cream,
              borderRadius: "50%",
              alignItems: "center",
              justifyContent: "center",
              fontSize: ".85rem",
              fontWeight: 600,
              marginBottom: ".8em",
            }}
          >
            {s.num}
          </span>
          <h4
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              color: COLORS.bordeaux,
              fontSize: "1rem",
              marginBottom: ".3em",
              fontWeight: 500,
            }}
          >
            {s.title}
          </h4>
          <p style={{ fontSize: ".82rem", color: COLORS.muted, margin: 0, lineHeight: 1.5 }}>{s.text}</p>
        </div>
      ))}
    </div>
  );
}

export default function GuideInternePage() {
  useEffect(() => {
    document.title = "Guide d'utilisation · Mariage Afro";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  return (
    <div style={{ background: COLORS.cream, color: COLORS.ink, fontFamily: "'Montserrat', sans-serif", lineHeight: 1.65 }}>
      {/* HERO */}
      <header
        style={{
          background: `linear-gradient(135deg, ${COLORS.wineDeep} 0%, ${COLORS.bordeaux} 100%)`,
          color: COLORS.cream,
          padding: "5rem 2rem 6rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: 980, margin: "0 auto", position: "relative" }}>
          <span
            style={{
              fontSize: ".72rem",
              fontWeight: 600,
              letterSpacing: ".25em",
              textTransform: "uppercase",
              color: COLORS.gold,
              marginBottom: "1em",
              display: "block",
            }}
          >
            Guide d'utilisation interne · v1
          </span>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              fontWeight: 500,
              color: COLORS.cream,
              marginBottom: ".3em",
              lineHeight: 1.1,
            }}
          >
            Mariage <em style={{ color: COLORS.gold, fontStyle: "italic" }}>Afro</em>
          </h1>
          <p style={{ fontSize: "1.15rem", maxWidth: 640, opacity: 0.9, marginBottom: "2rem" }}>
            La plateforme premium des mariages afro et mixtes en Belgique. Tout ce qu'il faut comprendre pour montrer
            et utiliser chaque fonctionnalité — du couple au prestataire, jusqu'à l'équipe d'administration.
          </p>
          <div
            style={{
              display: "flex",
              gap: "2rem",
              flexWrap: "wrap",
              paddingTop: "1.5rem",
              borderTop: "1px solid rgba(201, 169, 110, 0.3)",
              fontSize: ".85rem",
              opacity: 0.85,
            }}
          >
            <span><strong style={{ color: COLORS.gold }}>3 espaces</strong> — Couples · Prestataires · Admin</span>
            <span><strong style={{ color: COLORS.gold }}>3 langues</strong> — FR · NL · EN</span>
            <span><strong style={{ color: COLORS.gold }}>Belgique</strong> — Bruxelles · Wallonie · Flandre</span>
          </div>
        </div>
      </header>

      {/* TOC */}
      <nav
        style={{
          background: "rgba(250, 240, 220, 0.95)",
          borderBottom: `1px solid ${COLORS.line}`,
          padding: "1.5rem 2rem",
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: "2rem",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "1.4rem",
              color: COLORS.bordeaux,
              fontWeight: 600,
            }}
          >
            Mariage Afro
          </span>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", flex: 1 }}>
            {[
              { h: "#public", l: "Site public" },
              { h: "#couples", l: "Espace couples" },
              { h: "#pros", l: "Espace prestataires" },
              { h: "#admin", l: "Administration" },
              { h: "#parcours", l: "Parcours type" },
            ].map((it) => (
              <a
                key={it.h}
                href={it.h}
                style={{
                  fontSize: ".78rem",
                  fontWeight: 500,
                  letterSpacing: ".15em",
                  textTransform: "uppercase",
                  color: COLORS.ink,
                  textDecoration: "none",
                  padding: ".4rem 0",
                  borderBottom: "2px solid transparent",
                }}
              >
                {it.l}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* PUBLIC */}
      <section id="public" style={{ padding: "5rem 2rem", maxWidth: 1100, margin: "0 auto" }}>
        <SectionHead
          eyebrow="01 · Site public"
          title="La vitrine et la marketplace"
          intro="Pages accessibles sans connexion. C'est là que les futurs mariés découvrent la plateforme, comparent les prestataires et entrent en contact."
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          <FeatureCard
            route="/"
            title="Accueil cinématique"
            text="Intro vidéo, mise en avant des couples célébrés et accès rapide à toutes les sections clés."
            screenshot={`${SCREENS_BASE}01-home.jpg`}
          />
          <FeatureCard
            route="/plateforme"
            title="La plateforme"
            text="Présentation des 7 modules intégrés mis à disposition des couples (planning, budget, invités, site mariage…)."
            screenshot={`${SCREENS_BASE}03-plateforme.jpg`}
          />
          <FeatureCard
            route="/services"
            title="Services d'accompagnement"
            text="L'offre premium d'aide à l'organisation par l'équipe : full planning, day-of coordination, conseil."
            screenshot={`${SCREENS_BASE}10-services.jpg`}
          />
          <FeatureCard
            route="/partenaires"
            title="Annuaire prestataires"
            pill="Cœur"
            text="La marketplace : photographes, traiteurs, DJ, fleuristes… Filtres par catégorie, région et style. Fiches publiques détaillées."
            screenshot={`${SCREENS_BASE}02-partenaires.jpg`}
          />
          <FeatureCard
            route="/lieux"
            title="Lieux de réception"
            text="Recherche dédiée aux salles, châteaux et domaines belges, avec critères de capacité, style et région."
            screenshot={`${SCREENS_BASE}06-lieux.jpg`}
          />
          <FeatureCard
            route="/realisations"
            title="Réalisations"
            text="Storytelling et galeries de mariages réels organisés via la plateforme : preuve sociale et inspiration."
            screenshot={`${SCREENS_BASE}05-realisations.jpg`}
          />
          <FeatureCard
            route="/comparateur"
            title="Comparateur"
            text="Outil pour comparer jusqu'à 3 prestataires côte à côte (services, prix, avis) avant de décider."
            screenshot={`${SCREENS_BASE}09-comparateur.jpg`}
          />
          <FeatureCard
            route="/contact"
            title="Contact multi-étapes"
            text="Formulaire en 4 étapes (coordonnées · type · détails · message+récap). Tous les leads remontent dans le back-office admin."
            screenshot={`${SCREENS_BASE}04-contact.jpg`}
          />
          <FeatureCard
            route="/shop"
            title="Boutique"
            text="Accessoires et produits liés au mariage proposés par la marque. Source de revenus complémentaire."
          />
        </div>

        <h3
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "1.5rem",
            color: COLORS.bordeaux,
            marginTop: "3rem",
            marginBottom: "1rem",
            fontWeight: 500,
          }}
        >
          Outils gratuits — capture de leads
        </h3>
        <p style={{ color: COLORS.muted, marginBottom: "1.5rem" }}>
          Trois outils gratuits qui apportent de la valeur immédiate aux visiteurs et capturent leurs coordonnées en
          échange.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
          <FeatureCard
            route="/outils/budget"
            title="Calculateur budget"
            text="Estimation personnalisée en 5 étapes selon nombre d'invités, région et style souhaité."
            screenshot={`${SCREENS_BASE}07-budget.jpg`}
          />
          <FeatureCard
            route="/outils/quiz"
            title="Quiz style"
            text="7 questions pour révéler le style de mariage du couple et suggérer les bons prestataires."
            screenshot={`${SCREENS_BASE}08-quiz.jpg`}
          />
          <FeatureCard
            route="/guide"
            title="Guide PDF"
            text="Téléchargement gratuit du guide complet d'organisation, en échange de l'email."
          />
        </div>

        <h3
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "1.5rem",
            color: COLORS.bordeaux,
            marginTop: "3rem",
            marginBottom: "1rem",
            fontWeight: 500,
          }}
        >
          Sites mariages publics
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
          <FeatureCard
            route="/mariage/[slug]"
            title="Site du couple"
            text="Page personnalisée que chaque couple peut créer (image de couverture, programme, infos). QR code partageable aux invités."
          />
          <FeatureCard
            route="/mariage/[slug]/rsvp"
            title="RSVP invités"
            text="Formulaire de réponse pour les invités, avec questions personnalisables (allergies, navette, +1…)."
          />
          <FeatureCard
            route="/mariage/[slug]/cagnotte"
            title="Cagnotte en ligne"
            text="Page de participation financière des invités au voyage de noces ou au projet du couple."
          />
        </div>
      </section>

      {/* COUPLES */}
      <section id="couples" style={{ background: COLORS.creamSoft, padding: "5rem 2rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <SectionHead
            eyebrow="02 · Espace couples · B2C"
            title="Le tableau de bord des futurs mariés"
            intro="Accessible après inscription via Clerk, sous /espace-client. Un onboarding obligatoire en 5 étapes (Bienvenue · Vous · Partenaire · Date · Récap) accueille chaque nouveau couple. Ensuite, 13 modules pour piloter l'organisation de A à Z."
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
            <FeatureCard num="i." route="/espace-client/dashboard" title="Tableau de bord" bullets={[
              "Barre de progression globale du projet mariage",
              "Modification rapide des noms et de la date",
              "Rappel de la prochaine tâche urgente",
              "Tuiles de navigation vers tous les modules",
            ]} />
            <FeatureCard num="ii." route="/espace-client/budget" title="Budget" bullets={[
              "Tableaux Budget prévu / réel / payé",
              "Graphique en camembert par catégorie",
              "Ajout/suppression de postes de dépense",
              "Marquage \"payé\" et suivi des soldes",
            ]} />
            <FeatureCard num="iii." route="/espace-client/invites" title="Invités & RSVP" pill="Phare" bullets={[
              "Liste manuelle ou import CSV",
              "Suivi par côté (partenaire 1, 2, commun) et table",
              "Stats RSVP en temps réel (confirmés / en attente / déclinés)",
              "Questions personnalisables (allergies, navette…)",
              "Export CSV des réponses",
            ]} />
            <FeatureCard num="iv." route="/espace-client/plan-de-table" title="Plan de table" bullets={[
              "Création de tables (rondes, rectangulaires, carrées)",
              "Drag & drop des invités confirmés",
              "Export PNG ou PDF du plan final",
            ]} />
            <FeatureCard num="v." route="/espace-client/planning" title="Planning & tâches" bullets={[
              "Liste de tâches avec échéances et responsables",
              "3 vues : liste · semaine · mois",
              "Marquage des tâches complétées",
            ]} />
            <FeatureCard num="vi." route="/espace-client/prestataires" title="Mes prestataires" bullets={[
              "Annuaire personnel : contactés, négociation, réservés, payés",
              "Notes, montants et statuts",
              "Avis post-mariage sur les prestataires marketplace",
            ]} />
            <FeatureCard num="vii." route="/espace-client/site" title="Site mariage" pill="Phare" bullets={[
              "Slug personnalisable, titre, message d'accueil, programme",
              "Choix d'un template parmi plusieurs (couleurs & polices)",
              "Image de couverture compressée automatiquement",
              "Activation du module RSVP public",
              "Lien partageable + QR code téléchargeable",
            ]} />
            <FeatureCard num="viii." route="/espace-client/cagnotte" title="Cagnotte" text="Création et partage d'une cagnotte en ligne pour les invités souhaitant participer financièrement au projet." />
            <FeatureCard num="ix." route="/espace-client/communication" title="Communication" text="Centre de messages : échanges avec l'équipe Mariage Afro et avec les prestataires contactés." />
            <FeatureCard num="x." route="/espace-client/inspiration" title="Inspiration" text="Moodboard personnel pour rassembler images, ambiances et idées qui guident la décoration." />
            <FeatureCard num="xi." route="/espace-client/documents" title="Documents" text="Coffre-fort numérique pour stocker contrats, devis et factures liés au mariage." />
            <FeatureCard num="xii." route="/espace-client/jour-j" title="Jour J" text="Déroulé technique heure par heure de la journée, partageable avec les prestataires et témoins." />
          </div>
          <Banner
            title="À retenir pour le couple"
            text="Onboarding obligatoire en 5 étapes au premier login · Tous les uploads photo sont compressés dans le navigateur avant envoi (JPG/PNG/WebP uniquement) · Disponible en français, néerlandais et anglais."
          />
        </div>
      </section>

      {/* PROS */}
      <section id="pros" style={{ padding: "5rem 2rem", maxWidth: 1100, margin: "0 auto" }}>
        <SectionHead
          eyebrow="03 · Espace prestataires · B2B"
          title="La vitrine pro et le mini-CRM"
          intro="Accessible sous /espace-pro après inscription. Un onboarding en 6 étapes pose les bases (Entreprise · Contact · Catégorie · Lieu · Présence en ligne · Description). Ensuite, 9 modules pour gérer sa présence et convertir les leads."
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          <FeatureCard num="i." route="/espace-pro" title="Tableau de bord" bullets={[
            "Statut de la fiche : publiée ou en attente de modération",
            "KPIs sur 30 jours : vues, leads, messages non lus, conversion",
            "Graphiques d'historique sur 90 jours",
            "Classement dans la catégorie",
            "Checklist d'optimisation (logo, photos, descriptions multi-langues)",
          ]} />
          <FeatureCard num="ii." route="/espace-pro/leads" title="Demandes de devis" pill="Phare" bullets={[
            "Vue tableau ou Kanban",
            "Types : devis, dispo, réservation, appel Zoom, RDV",
            "Statuts : nouveau · vu · contacté · devis envoyé · gagné · perdu",
            "CRM léger : notes privées, étiquettes (Hot, VIP, à relancer)",
            "Badge de notification pour les nouveaux leads",
          ]} />
          <FeatureCard num="iii." route="/espace-pro/messages" title="Messagerie" bullets={[
            "Chat temps réel avec les couples (polling 5s)",
            "Conversations groupées par couple",
            "Indicateur lus / non-lus",
            "Échanges modérés et sécurisés sur la plateforme",
          ]} />
          <FeatureCard num="iv." route="/espace-pro/profile" title="Mon profil" bullets={[
            "Nom, slogan, description longue",
            "Site web, téléphone, email de contact",
            "Logo (compression et redimensionnement automatiques)",
          ]} />
          <FeatureCard num="v." route="/espace-pro/gallery" title="Galerie photo" pill="Phare" bullets={[
            "Upload multiple optimisé",
            "Choix de la photo de couverture (mise en avant marketplace)",
            "Suppression et réorganisation",
          ]} />
          <FeatureCard num="vi." route="/espace-pro/services" title="Services" text="Liste des prestations proposées avec descriptions et tarifs (ex: « Reportage 8h », « Album photo », « Forfait demi-journée »)." />
          <FeatureCard num="vii." route="/espace-pro/agenda" title="Agenda" bullets={[
            "Calendrier interactif des disponibilités",
            "Blocage manuel de dates indisponibles",
            "Réservations automatiques verrouillées dès qu'un mariage est confirmé",
          ]} />
          <FeatureCard num="viii." route="/espace-pro/abonnement" title="Abonnement" bullets={[
            "Basic — Profil public, leads illimités, messagerie",
            "Premium — Mise en avant, badge, support prioritaire",
            "Featured — Top de liste, accueil, account manager",
            "Activation par contact équipe (pas de paiement carte direct)",
          ]} />
          <FeatureCard num="ix." route="/espace-pro/settings" title="Paramètres" bullets={[
            "Rappels automatiques par email pour les leads sans réponse",
            "Configuration des étiquettes CRM personnalisées",
            "Préférences de notifications",
          ]} />
        </div>
        <Banner
          title="À retenir pour le prestataire"
          text="Validation manuelle de la fiche par l'équipe avant publication · Tous les leads passent par la plateforme, jamais en direct · Les modèles d'abonnement se choisissent depuis le dashboard mais s'activent par échange humain."
        />
      </section>

      {/* ADMIN */}
      <section id="admin" style={{ background: COLORS.creamSoft, padding: "5rem 2rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <SectionHead
            eyebrow="04 · Administration"
            title="Le back-office équipe Mariage Afro"
            intro="Espace réservé à l'équipe sous /admin. Pages générées en HTML côté serveur pour la sécurité et la rapidité. Pilote toute la modération, la validation et le suivi commercial."
          />
          <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.5rem", color: COLORS.bordeaux, marginBottom: "1rem", fontWeight: 500 }}>Tableau de bord & demandes</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
            <FeatureCard route="/admin" title="Dashboard global" text="Centralisation de toutes les demandes entrantes, filtres par type et statut, compteurs de leads par source." />
            <FeatureCard route="/admin/leads/:type/:id" title="Détail d'un lead" text="Consultation complète et changement de statut pour les leads généraux, calculateur budget, quiz, téléchargement guide PDF, multi-devis." />
          </div>
          <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.5rem", color: COLORS.bordeaux, marginTop: "2.5rem", marginBottom: "1rem", fontWeight: 500 }}>Modération & validation</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
            <FeatureCard route="/admin/reviews" title="Modération des avis" text="Validation, rejet ou remise en modération des avis laissés par les couples sur les prestataires." />
            <FeatureCard route="/admin/content/vendor-accounts" title="Comptes prestataires" pill="Clé" pillVariant="alt" text="Validation des nouveaux comptes pros inscrits avant publication de leur fiche." />
            <FeatureCard route="/admin/content/wedding-websites" title="Sites mariages" text="Liste et modération des sites publics créés par les couples." />
            <FeatureCard route="/admin/subscriptions" title="Abonnements pros" text="Suivi des paiements, activation des accès Premium et Featured pour les prestataires." />
          </div>
          <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.5rem", color: COLORS.bordeaux, marginTop: "2.5rem", marginBottom: "1rem", fontWeight: 500 }}>Contenu marketplace</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            <FeatureCard route="/admin/content/vendors" title="Prestataires" text="CRUD complet, marquage « Vérifié », activation/désactivation d'une fiche." />
            <FeatureCard route="/admin/content/venues" title="Lieux" text="Gestion des fiches lieux de réception (salles, châteaux, domaines)." />
            <FeatureCard route="/admin/content/realisations" title="Réalisations" text="Publication de mariages réels avec storytelling et galeries photo." />
          </div>
          <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.5rem", color: COLORS.bordeaux, marginTop: "2.5rem", marginBottom: "1rem", fontWeight: 500 }}>Communication interne</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
            <FeatureCard route="/admin/content/messages" title="Messages avec couples" text="Fil de discussion direct entre l'équipe Mariage Afro et chaque couple inscrit." />
            <FeatureCard route="/admin/content/conversations" title="Conversations pros (lecture seule)" pill="Modération" text="Surveillance des échanges entre couples et prestataires pour assurer la qualité et la sécurité." />
          </div>
          <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.5rem", color: COLORS.bordeaux, marginTop: "2.5rem", marginBottom: "1rem", fontWeight: 500 }}>Système</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
            <FeatureCard route="/admin/status" title="Statut serveur" text="Vérification de la configuration : variables d'environnement, intégrations, santé des services." />
            <FeatureCard route="/api/healthz" title="Health check" text="Endpoint de monitoring renvoyant l'état de l'API et de la base de données." />
          </div>
          <Banner
            title="À retenir pour l'admin"
            text="Tout passe par la modération avant d'être public : fiches pros, avis, sites mariages · Les emails transactionnels (notifications leads, validations) nécessitent les secrets Resend configurés · Les conversations pros/couples sont consultables en lecture seule pour garantir la qualité."
          />
        </div>
      </section>

      {/* PARCOURS */}
      <section id="parcours" style={{ padding: "5rem 2rem", maxWidth: 1100, margin: "0 auto" }}>
        <SectionHead
          eyebrow="05 · Parcours type"
          title="Comment tout s'enchaîne"
          intro="Trois scénarios concrets pour comprendre la valeur que reçoit chaque acteur, étape par étape."
        />
        <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.4rem", color: COLORS.bordeaux, marginBottom: ".5rem", fontWeight: 500 }}>Un couple qui prépare son mariage</h3>
        <FlowGrid steps={[
          { num: 1, title: "Découverte", text: "Arrive via le calculateur de budget ou le quiz style." },
          { num: 2, title: "Inscription", text: "Crée son compte (Clerk) et complète l'onboarding 5 étapes." },
          { num: 3, title: "Recherche", text: "Explore la marketplace, demande des devis groupés." },
          { num: 4, title: "Organisation", text: "Pilote budget, invités, planning, plan de table." },
          { num: 5, title: "Site mariage", text: "Publie son site, active RSVP, partage QR code." },
          { num: 6, title: "Jour J", text: "Suit le déroulé et laisse ses avis prestataires après." },
        ]} />
        <div style={{ textAlign: "center", margin: "3rem 0 2rem", color: COLORS.gold, fontSize: "1.5rem", letterSpacing: "1em" }}>· · ·</div>
        <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.4rem", color: COLORS.bordeaux, marginBottom: ".5rem", fontWeight: 500 }}>Un prestataire qui rejoint la plateforme</h3>
        <FlowGrid steps={[
          { num: 1, title: "Inscription", text: "Crée son compte pro et passe l'onboarding 6 étapes." },
          { num: 2, title: "Validation", text: "L'équipe admin valide la fiche depuis le back-office." },
          { num: 3, title: "Vitrine", text: "Complète profil, galerie, services pour optimiser." },
          { num: 4, title: "Réception leads", text: "Reçoit les demandes via email + dashboard, qualifie en Kanban." },
          { num: 5, title: "Conversion", text: "Échange via la messagerie, envoie devis, gagne ou perd." },
          { num: 6, title: "Croissance", text: "Demande Premium ou Featured pour plus de visibilité." },
        ]} />
        <div style={{ textAlign: "center", margin: "3rem 0 2rem", color: COLORS.gold, fontSize: "1.5rem", letterSpacing: "1em" }}>· · ·</div>
        <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.4rem", color: COLORS.bordeaux, marginBottom: ".5rem", fontWeight: 500 }}>L'équipe Mariage Afro au quotidien</h3>
        <FlowGrid steps={[
          { num: 1, title: "Triage leads", text: "Consulte le dashboard admin, qualifie et redirige." },
          { num: 2, title: "Validation pros", text: "Approuve ou rejette les nouveaux comptes prestataires." },
          { num: 3, title: "Modération", text: "Valide les avis, surveille les conversations sensibles." },
          { num: 4, title: "Contenu", text: "Publie réalisations, ajoute lieux, met à jour fiches vérifiées." },
          { num: 5, title: "Commercial", text: "Gère les abonnements pros et facture en direct." },
          { num: 6, title: "Support", text: "Répond aux couples via la messagerie admin." },
        ]} />
      </section>

      {/* QUICK FACTS */}
      <section style={{ background: COLORS.wineDeep, color: COLORS.cream, padding: "5rem 2rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <span style={{ fontSize: ".72rem", fontWeight: 600, letterSpacing: ".25em", textTransform: "uppercase", color: COLORS.gold, marginBottom: "1em", display: "block" }}>
            Repères techniques
          </span>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: COLORS.cream, marginBottom: "2rem", fontWeight: 500 }}>
            L'essentiel à savoir
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>
            {[
              { t: "Authentification", d: "Gérée par Clerk. Comptes séparés couples / prestataires. Onboarding obligatoire au premier login." },
              { t: "Langues", d: "Français, néerlandais, anglais sur tout le site public et les espaces. Sélecteur dans l'en-tête." },
              { t: "Emails", d: "Transactionnels via Resend (notifications leads, confirmations devis, alertes admin)." },
              { t: "Stockage photos", d: "Object storage avec compression navigateur avant envoi : JPG/PNG/WebP uniquement, redimensionnés. Pas de doublon." },
              { t: "Paiements", d: "Pas de paiement carte intégré côté prestataires : facturation directe par l'équipe après demande." },
              { t: "Charte visuelle", d: "Cormorant Garamond pour les titres, Montserrat pour le corps. Bordeaux #68191e, crème #fff4e4, doré #c9a96e." },
            ].map((it) => (
              <div key={it.t} style={{ background: "rgba(255, 244, 228, 0.04)", border: "1px solid rgba(201, 169, 110, 0.25)", padding: "1.6rem", borderRadius: 4 }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: COLORS.gold, fontSize: "1.3rem", marginBottom: ".4em", fontWeight: 500 }}>{it.t}</h3>
                <p style={{ color: COLORS.cream, opacity: 0.85, fontSize: ".92rem", margin: 0, lineHeight: 1.6 }}>{it.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: COLORS.wineDeep, color: COLORS.cream, padding: "3rem 2rem", textAlign: "center", borderTop: "1px solid rgba(201, 169, 110, 0.2)" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.8rem", color: COLORS.gold, marginBottom: ".5rem" }}>
          Mariage Afro
        </div>
        <p style={{ opacity: 0.7, fontSize: ".85rem", margin: 0 }}>
          Plateforme premium pour les mariages afro et mixtes en Belgique.
        </p>
        <div style={{ marginTop: "1.5rem", fontSize: ".75rem", opacity: 0.5, letterSpacing: ".1em", textTransform: "uppercase" }}>
          Guide d'utilisation interne · Page non indexée
        </div>
      </footer>
    </div>
  );
}
