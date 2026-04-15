# PROMPT REPLIT — MARIAGE AFRO V1
**Afro & Mixed Wedding Platform — Site vitrine premium multilingue**

---

## CONTEXTE PROJET

Tu vas construire le site vitrine V1 de **Mariage Afro**, une plateforme haut de gamme dédiée aux mariages afro et mixtes en Belgique. Ce n'est pas un simple wedding planner : c'est une plateforme complète qui connecte les couples à des prestataires de qualité et propose une organisation de A à Z.

Le site doit inspirer confiance immédiatement, refléter le luxe accessible, et convertir les visiteurs en demandes de rendez-vous.

**Stack imposée :** Next.js 14 App Router · TypeScript · Tailwind CSS · Framer Motion · Resend (formulaire de contact) · next-intl (i18n)

---

## BRANDING & DESIGN SYSTEM

### Couleurs (CSS variables dans globals.css)
```css
:root {
  --color-primary: #68191e;       /* Bordeaux — couleur principale */
  --color-primary-light: #8b2329; /* Bordeaux clair hover */
  --color-secondary: #fff4e4;     /* Crème — arrière-plans chauds */
  --color-white: #ffffff;
  --color-dark: #141414;          /* Quasi-noir */
  --color-dark-80: rgba(20,20,20,0.8);
  --color-border: rgba(104,25,30,0.15);
}
```

### Typographie
- **Font principale :** Montserrat (Google Fonts) — Light 300 / Regular 400 / Bold 700
- Import dans layout.tsx : `next/font/google` avec weights `['300','400','700']`
- Titres : Montserrat Bold, tracking légèrement espacé (`letter-spacing: 0.02em`)
- Corps : Montserrat Light/Regular
- **Pas d'autres fonts** — Montserrat uniquement
- **Aucun emoji** — SVG icons uniquement

### Style général
- Luxe épuré avec chaleur : beaucoup d'espace négatif, sections alternant fond crème (`#fff4e4`) et fond blanc
- Sections sombres en `#141414` avec texte blanc pour les moments d'impact
- Accents bordeaux sur CTA, séparateurs fins, hover states
- Animations Framer Motion : fade-in staggeré au scroll, transitions douces (0.6s ease)
- Mobile-first absolu : breakpoints Tailwind `sm` → `md` → `lg` → `xl`
- Aucun border-radius excessif : max 4px sur les boutons (style carré/premium)

---

## ARCHITECTURE DU PROJET

```
/app
  /[locale]
    layout.tsx
    page.tsx              ← Home
    /services/page.tsx
    /prestations/page.tsx
    /realisations/page.tsx
    /a-propos/page.tsx
    /contact/page.tsx
/components
  /layout
    Header.tsx
    Footer.tsx
    LanguageSwitcher.tsx
  /sections
    Hero.tsx
    ValueProposition.tsx
    ServicesPreview.tsx
    FilmDeMiel.tsx
    Testimonials.tsx
    CtaBanner.tsx
    ContactForm.tsx
  /ui
    Button.tsx
    SectionTitle.tsx
    AnimatedSection.tsx
/messages
  fr.json
  nl.json
  en.json
/public
  /images
    placeholder-hero.jpg
    placeholder-wedding-1.jpg
    placeholder-wedding-2.jpg
    placeholder-wedding-3.jpg
```

---

## MULTILINGUE (next-intl)

**Langues :** FR (défaut) · NL · EN

Structure middleware.ts avec `locales: ['fr', 'nl', 'en']` et `defaultLocale: 'fr'`.

### Fichier /messages/fr.json (structure à répliquer en NL et EN)
```json
{
  "nav": {
    "home": "Accueil",
    "services": "Nos services",
    "prestations": "Nos prestations",
    "realisations": "Nos réalisations",
    "about": "À propos",
    "contact": "Contact",
    "cta": "Prendre rendez-vous"
  },
  "hero": {
    "tagline": "Afro & Mixed Wedding Platform",
    "title": "Votre mariage,\nexactement comme\nvous l'imaginez.",
    "subtitle": "La première plateforme dédiée aux mariages afro et mixtes en Belgique. Organisation complète, prestataires sélectionnés, moments inoubliables.",
    "cta_primary": "Prendre rendez-vous",
    "cta_secondary": "Découvrir la plateforme"
  },
  "value_props": {
    "title": "Pourquoi choisir Mariage Afro ?",
    "items": [
      { "title": "Plateforme complète", "desc": "De la planification au Jour J, tous vos besoins en un seul endroit." },
      { "title": "Experts afro & mixtes", "desc": "Nous comprenons vos traditions, vos cultures, vos attentes." },
      { "title": "Prestataires sélectionnés", "desc": "Photo, vidéo, DJ, décoration, traiteur — uniquement le meilleur." },
      { "title": "Accompagnement personnalisé", "desc": "Un interlocuteur dédié du premier contact jusqu'au bouquet final." }
    ]
  },
  "services": {
    "title": "Nos services",
    "subtitle": "Trois formules pour vous accompagner",
    "items": [
      {
        "title": "Organisation complète",
        "desc": "Nous gérons tout de A à Z : budget, prestataires, logistique, coordination. Vous profitez, on s'occupe du reste.",
        "cta": "En savoir plus"
      },
      {
        "title": "Coordination Jour J",
        "desc": "Votre mariage est planifié, mais vous voulez quelqu'un de confiance pour superviser le déroulement le grand jour.",
        "cta": "En savoir plus"
      },
      {
        "title": "Destination Wedding",
        "desc": "Vous rêvez d'un mariage en Afrique ou ailleurs dans le monde ? Nous gérons tout à distance.",
        "cta": "En savoir plus"
      }
    ]
  },
  "film_de_miel": {
    "label": "Notre partenaire vidéo intégré",
    "title": "Film de Miel",
    "desc": "Studio vidéo premium intégré à Mariage Afro. Des films de mariage cinématographiques qui capturent chaque émotion, chaque regard, chaque danse.",
    "cta": "Voir les réalisations"
  },
  "prestations": {
    "title": "Nos prestations",
    "subtitle": "Un réseau de prestataires d'exception",
    "items": [
      "Photographie",
      "Vidéo & Film (Film de Miel)",
      "DJ & Animation",
      "Décoration florale",
      "Catering & Traiteur",
      "Coiffure & Maquillage",
      "Location de salle",
      "Transport & Limousines"
    ]
  },
  "contact": {
    "title": "Parlons de votre mariage",
    "subtitle": "Prenez rendez-vous pour une première consultation gratuite — en personne, par téléphone ou en visioconférence.",
    "form": {
      "name": "Nom complet",
      "email": "Adresse email",
      "phone": "Téléphone",
      "date": "Date envisagée du mariage",
      "type": "Type de mariage",
      "type_options": ["Mariage afro", "Mariage mixte", "Destination wedding", "Autre"],
      "message": "Votre message",
      "submit": "Envoyer ma demande",
      "success": "Merci ! Nous vous recontactons dans les 24h.",
      "error": "Une erreur est survenue. Veuillez réessayer."
    }
  },
  "footer": {
    "tagline": "Afro & Mixed Wedding Platform",
    "links_title": "Navigation",
    "contact_title": "Contact",
    "address": "Bruxelles, Belgique",
    "email": "info@mariage-afro.com",
    "phone": "+32 XXX XX XX XX",
    "social": "Suivez-nous",
    "credit": "Site réalisé par Done. — madebydone.be",
    "legal": "Mentions légales · Politique de confidentialité"
  }
}
```

---

## PAGES & SECTIONS — DÉTAIL COMPLET

### 1. HEADER (Header.tsx)
- Fond blanc avec légère ombre au scroll (`box-shadow: 0 1px 20px rgba(0,0,0,0.06)`)
- Logo "MARIAGE AFRO" en Montserrat Bold bordeaux + tagline "Afro & Mixed Wedding Platform" en Light très petit
- Navigation horizontale desktop : liens en Montserrat Regular, hover underline bordeaux animé
- CTA "Prendre rendez-vous" : bouton bordeaux plein, texte blanc, sans radius excessif
- Mobile : hamburger menu, slide-in depuis la droite (Framer Motion), fond blanc
- LanguageSwitcher discret : FR · NL · EN — texte, pas dropdown

### 2. PAGE HOME (page.tsx)

#### Section Hero
- **Plein écran** (100vh minimum)
- Fond sombre `#141414` avec overlay de texture grain subtil (SVG noise filter ou CSS)
- Image de couple en arrière-plan (opacity 0.3) — `placeholder-hero.jpg`
- Contenu centré verticalement :
  - Petit label bordeaux uppercase : "Afro & Mixed Wedding Platform"
  - H1 très grand (clamp 48px → 80px), Montserrat Bold, blanc, avec retours à la ligne intentionnels
  - Paragraph Montserrat Light, blanc opacity 0.8, max-width 580px
  - Deux CTA : [Prendre rendez-vous] bouton bordeaux plein + [Découvrir la plateforme] bouton outline blanc
- Scroll indicator animé en bas (chevron ou trait)
- Animation : fade-in staggeré des éléments avec Framer Motion (0ms, 200ms, 400ms, 600ms delay)

#### Section Value Proposition
- Fond crème `#fff4e4`
- 4 colonnes desktop / 2 colonnes tablette / 1 colonne mobile
- Chaque bloc : icône SVG bordeaux (40px), titre Montserrat Bold, texte Light
- Icônes suggérées (SVG inline simples) : étoile, cœur, loupe, personne

#### Section Services (aperçu)
- Fond blanc
- SectionTitle centré : "Nos services"
- 3 cards en row desktop, stack mobile
- Chaque card : fond crème, titre bordeaux Bold, description Light, CTA texte bordeaux avec flèche →
- Hover : légère élévation (transform: translateY(-4px)) avec transition

#### Section Film de Miel
- Fond `#141414`
- Layout 2 colonnes : texte à gauche, placeholder vidéo/image à droite
- Label "Notre partenaire vidéo intégré" en bordeaux uppercase
- Titre blanc Bold
- Description blanc Light
- CTA outline bordeaux

#### Section Prestations (icônes grid)
- Fond crème `#fff4e4`
- Grid 4x2 desktop, 2x4 mobile
- Chaque prestation : icône SVG, label Montserrat Regular centré

#### Section CTA Final
- Fond bordeaux `#68191e`
- Texte blanc centré : "Prêts à commencer ?" grand titre + sous-titre
- CTA bouton blanc avec texte bordeaux

### 3. PAGE SERVICES (/services)
- Hero section compact (40vh) fond `#141414`, titre "Nos services" + breadcrumb
- 3 sections détaillées (une par service) alternant fond blanc / fond crème :
  - Organisation complète : liste de ce qui est inclus (planning, budget, coordination, etc.)
  - Coordination Jour J : déroulé type, promesse de sérénité
  - Destination Wedding : destinations proposées, processus à distance
- CTA "Prendre rendez-vous" à la fin de chaque section

### 4. PAGE PRESTATIONS (/prestations)
- Hero compact `#141414`
- Grid de 8 prestations avec description développée pour chacune
- Mise en avant spéciale Film de Miel avec section dédiée
- CTA global en bas

### 5. PAGE RÉALISATIONS (/realisations)
- Hero compact
- Grid masonry-like : 3 colonnes desktop, 2 tablette, 1 mobile
- Placeholders avec aspect-ratio 3/4 (portrait) pour photos mariage
- Intégration d'un placeholder vidéo (iframe YouTube-ready avec play button overlay)
- Filtre simple : Tous · Photo · Vidéo (tabs avec underline bordeaux animé)

### 6. PAGE À PROPOS (/a-propos)
- Hero compact
- Section vision : texte long, layout éditorial (grande quote en bordeaux)
- Section concept : "Pourquoi Mariage Afro ?" avec paragraphes
- Section équipe : placeholder cards (photo + nom + rôle)
- Section chiffres : 3 stats (ex: X mariages organisés, X prestataires, X années d'expérience) — grands chiffres bordeaux Bold

### 7. PAGE CONTACT (/contact)
- Hero compact fond `#141414`
- Layout 2 colonnes desktop (60% form / 40% infos) — stack mobile
- **Formulaire** (Resend) :
  - Champs : Nom complet · Email · Téléphone · Date envisagée · Type de mariage (select) · Message
  - Validation côté client (états error en rouge bordeaux)
  - Submit avec état loading (spinner bordeaux)
  - Success message en place du formulaire
- **Infos de contact** : adresse · email · téléphone · horaires
- **3 modes de RDV** : En personne · Téléphone · Zoom — avec icônes SVG

---

## COMPOSANTS RÉUTILISABLES

### Button.tsx
```tsx
type ButtonProps = {
  variant: 'primary' | 'outline' | 'outline-white' | 'text';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}
```
- `primary` : fond bordeaux, texte blanc
- `outline` : bordure bordeaux, texte bordeaux, fond transparent
- `outline-white` : bordure blanc, texte blanc (pour sections sombres)
- `text` : pas de fond, texte bordeaux + flèche → animée au hover
- Transitions Tailwind : `transition-all duration-300`
- Padding : `sm` 8px 20px · `md` 12px 28px · `lg` 16px 36px
- Pas de border-radius ou max 2px

### SectionTitle.tsx
```tsx
type SectionTitleProps = {
  label?: string;   // petit label uppercase bordeaux au-dessus
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  theme?: 'light' | 'dark';
}
```

### AnimatedSection.tsx
Wrapper Framer Motion pour fade-in au scroll :
```tsx
// useInView avec threshold 0.15
// opacity: 0 → 1, translateY: 30px → 0
// duration: 0.6s, ease: [0.22, 0.61, 0.36, 1]
```

---

## FORMULAIRE CONTACT — RESEND

### /app/api/contact/route.ts
```ts
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const body = await req.json();
  const { name, email, phone, date, type, message } = body;
  
  // Validation basique
  if (!name || !email || !message) {
    return Response.json({ error: 'Champs requis manquants' }, { status: 400 });
  }
  
  await resend.emails.send({
    from: 'Mariage Afro <noreply@mariage-afro.com>',
    to: 'info@mariage-afro.com',
    subject: `Nouvelle demande de RDV — ${name}`,
    html: `
      <h2>Nouvelle demande de rendez-vous</h2>
      <p><strong>Nom :</strong> ${name}</p>
      <p><strong>Email :</strong> ${email}</p>
      <p><strong>Téléphone :</strong> ${phone || 'Non renseigné'}</p>
      <p><strong>Date envisagée :</strong> ${date || 'Non renseignée'}</p>
      <p><strong>Type de mariage :</strong> ${type || 'Non renseigné'}</p>
      <p><strong>Message :</strong></p>
      <p>${message}</p>
    `
  });
  
  return Response.json({ success: true });
}
```

---

## FOOTER (Footer.tsx)

- Fond `#141414`
- 4 colonnes desktop : Logo+tagline · Navigation · Contact · Réseaux
- Logo Montserrat Bold bordeaux + tagline Light blanc
- Liens en blanc opacity 0.7, hover blanc
- Séparateur fin bordeaux opacity 0.3
- Bottom bar : copyright + "Site réalisé par Done. — madebydone.be" + liens légaux
- Icônes réseaux sociaux : Instagram · Facebook · TikTok (SVG simples)

---

## CONFIGURATION TECHNIQUE

### tailwind.config.ts
```ts
theme: {
  extend: {
    colors: {
      primary: '#68191e',
      'primary-light': '#8b2329',
      secondary: '#fff4e4',
      dark: '#141414',
    },
    fontFamily: {
      montserrat: ['Montserrat', 'sans-serif'],
    },
  }
}
```

### globals.css
- Import Montserrat via next/font
- `body { font-family: var(--font-montserrat), sans-serif; }`
- `html { scroll-behavior: smooth; }`
- Scrollbar custom bordeaux (WebKit)
- Reset box-sizing border-box

### Variables d'environnement (.env.local)
```
RESEND_API_KEY=xxx
NEXT_PUBLIC_SITE_URL=https://mariage-afro.com
```

### next.config.ts
- Configuration next-intl
- Images optimisées : `domains: ['mariage-afro.com', 'via.placeholder.com']`

---

## IMAGES PLACEHOLDER

Utilise des images placeholder professionnelles pour les mariages :
- Hero : fond sombre avec couple, filtre assombri
- Portfolio : images format portrait 3:4 avec overlay bordeaux au hover
- Toutes les images : `<Image>` Next.js avec `alt` descriptifs pour SEO
- Lazy loading natif Next.js

---

## SEO & META

Dans chaque page, utilise `generateMetadata()` :
```ts
// Page home exemple
export const metadata = {
  title: 'Mariage Afro — Afro & Mixed Wedding Platform | Belgique',
  description: 'La première plateforme dédiée aux mariages afro et mixtes en Belgique. Organisation complète, coordination Jour J, destination wedding. Prestataires sélectionnés.',
  openGraph: {
    title: 'Mariage Afro — Afro & Mixed Wedding Platform',
    description: '...',
    url: 'https://mariage-afro.com',
    siteName: 'Mariage Afro',
    locale: 'fr_BE',
  }
}
```

---

## CHECKLIST FINALE AVANT LIVRAISON

- [ ] Toutes les pages accessibles via navigation
- [ ] Formulaire de contact fonctionnel (test Resend)
- [ ] Switcher de langue opérationnel (FR / NL / EN)
- [ ] Responsive vérifié sur 375px (iPhone SE), 768px (tablette), 1440px (desktop)
- [ ] Console Replit sans erreurs TypeScript
- [ ] Animations Framer Motion fluides (pas de jank)
- [ ] Favicon : créer un favicon bordeaux avec "MA" ou le logo simplifié
- [ ] Footer credit "Site réalisé par Done. — madebydone.be" présent

---

*Prompt réalisé par Done. — madebydone.be*
