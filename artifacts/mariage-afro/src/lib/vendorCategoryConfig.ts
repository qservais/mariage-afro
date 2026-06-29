export type CategoryFieldType = "text" | "number" | "select" | "textarea";

export interface CategoryField {
  key: string;
  labelFr: string;
  labelNl: string;
  labelEn: string;
  type: CategoryFieldType;
  options?: string[];
  optionsNl?: string[];
  optionsEn?: string[];
  required?: boolean;
  placeholder?: string;
}

export interface CategoryConfig {
  suggestedServices: string[];
  quoteFields: CategoryField[];
}

export const VENDOR_CATEGORIES: string[] = [
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

export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  Photographie: {
    suggestedServices: [
      "Reportage cérémonie",
      "Shooting fiançailles",
      "Séance engagement",
      "Album photo premium",
      "Retouche artistique",
      "Livraison galerie en ligne",
    ],
    quoteFields: [
      {
        key: "hours",
        labelFr: "Nombre d'heures souhaitées",
        labelNl: "Gewenst aantal uren",
        labelEn: "Desired number of hours",
        type: "number",
        placeholder: "ex: 8",
      },
      {
        key: "photoStyle",
        labelFr: "Style photographique",
        labelNl: "Fotografiestijl",
        labelEn: "Photography style",
        type: "select",
        options: ["Reportage naturel", "Studio / posé", "Artistique / éditorial", "Mixte"],
        optionsNl: ["Natuurlijke reportage", "Studio / geposeerd", "Artistiek / redactioneel", "Mix"],
        optionsEn: ["Natural reportage", "Studio / posed", "Artistic / editorial", "Mixed"],
      },
      {
        key: "videoAlso",
        labelFr: "Souhaitez-vous aussi une vidéo ?",
        labelNl: "Wilt u ook een video?",
        labelEn: "Would you also like video?",
        type: "select",
        options: ["Non", "Oui, clip court", "Oui, film complet"],
        optionsNl: ["Nee", "Ja, korte clip", "Ja, volledige film"],
        optionsEn: ["No", "Yes, short clip", "Yes, full film"],
      },
    ],
  },
  "Vidéo": {
    suggestedServices: [
      "Film de mariage complet",
      "Clip émotionnel (5 min)",
      "Teaser réseaux sociaux",
      "Drone & prises aériennes",
      "Reportage cérémonie",
    ],
    quoteFields: [
      {
        key: "hours",
        labelFr: "Nombre d'heures de tournage",
        labelNl: "Aantal uren opname",
        labelEn: "Number of filming hours",
        type: "number",
        placeholder: "ex: 10",
      },
      {
        key: "videoFormat",
        labelFr: "Format souhaité",
        labelNl: "Gewenst formaat",
        labelEn: "Desired format",
        type: "select",
        options: ["Clip court (3–5 min)", "Film long (30–60 min)", "Les deux", "À définir"],
        optionsNl: ["Korte clip (3–5 min)", "Lange film (30–60 min)", "Beide", "Nader te bepalen"],
        optionsEn: ["Short clip (3–5 min)", "Long film (30–60 min)", "Both", "To be defined"],
      },
      {
        key: "drone",
        labelFr: "Drone souhaité ?",
        labelNl: "Drone gewenst?",
        labelEn: "Drone desired?",
        type: "select",
        options: ["Non", "Oui"],
        optionsNl: ["Nee", "Ja"],
        optionsEn: ["No", "Yes"],
      },
    ],
  },
  "DJ & Animation": {
    suggestedServices: [
      "DJ mariage",
      "Sonorisation cérémonie",
      "Animation soirée",
      "Éclairages & effets",
      "MC / Maître de cérémonie",
      "Karaoké",
    ],
    quoteFields: [
      {
        key: "hours",
        labelFr: "Durée de la prestation (heures)",
        labelNl: "Duur van de prestatie (uren)",
        labelEn: "Duration of the service (hours)",
        type: "number",
        placeholder: "ex: 6",
      },
      {
        key: "musicStyle",
        labelFr: "Style musical souhaité",
        labelNl: "Gewenste muziekstijl",
        labelEn: "Desired music style",
        type: "select",
        options: [
          "Afrobeats / Afropop",
          "R&B / Soul",
          "Dancehall / Reggae",
          "Coupé-décalé / Rumba",
          "Mix éclectique",
          "Autre",
        ],
        optionsNl: [
          "Afrobeats / Afropop",
          "R&B / Soul",
          "Dancehall / Reggae",
          "Coupé-décalé / Rumba",
          "Eclectische mix",
          "Andere",
        ],
        optionsEn: [
          "Afrobeats / Afropop",
          "R&B / Soul",
          "Dancehall / Reggae",
          "Coupé-décalé / Rumba",
          "Eclectic mix",
          "Other",
        ],
      },
      {
        key: "ceremony",
        labelFr: "Sonorisation cérémonie incluse ?",
        labelNl: "Ceremonie geluidsinstallatie inbegrepen?",
        labelEn: "Ceremony sound system included?",
        type: "select",
        options: ["Non", "Oui"],
        optionsNl: ["Nee", "Ja"],
        optionsEn: ["No", "Yes"],
      },
    ],
  },
  "Décoration": {
    suggestedServices: [
      "Décoration salle",
      "Arche florale",
      "Décoration de table",
      "Photobooth",
      "Allée de cérémonie",
      "Coordination jour J",
    ],
    quoteFields: [
      {
        key: "guestCount",
        labelFr: "Nombre d'invités",
        labelNl: "Aantal gasten",
        labelEn: "Number of guests",
        type: "number",
        placeholder: "ex: 150",
      },
      {
        key: "decoStyle",
        labelFr: "Style de décoration",
        labelNl: "Decoratiestijl",
        labelEn: "Decoration style",
        type: "select",
        options: [
          "Bohème / Naturel",
          "Luxe / Glamour",
          "Traditionnel africain",
          "Moderne & épuré",
          "Floral & romantique",
        ],
        optionsNl: [
          "Bohemien / Natuurlijk",
          "Luxe / Glamour",
          "Traditioneel Afrikaans",
          "Modern & strak",
          "Bloemen & romantisch",
        ],
        optionsEn: [
          "Bohemian / Natural",
          "Luxury / Glamour",
          "Traditional African",
          "Modern & minimalist",
          "Floral & romantic",
        ],
      },
      {
        key: "colorPalette",
        labelFr: "Palette de couleurs",
        labelNl: "Kleurenpalet",
        labelEn: "Color palette",
        type: "text",
        placeholder: "ex: Or, Blanc, Bordeaux",
      },
    ],
  },
  Traiteur: {
    suggestedServices: [
      "Formule cocktail",
      "Menu assis (buffet)",
      "Menu assis (service à table)",
      "Cuisine africaine traditionnelle",
      "Cuisine fusion",
      "Gâteau de mariage",
      "Bar & boissons",
    ],
    quoteFields: [
      {
        key: "guestCount",
        labelFr: "Nombre de couverts",
        labelNl: "Aantal couverts",
        labelEn: "Number of covers",
        type: "number",
        required: true,
        placeholder: "ex: 120",
      },
      {
        key: "serviceType",
        labelFr: "Type de service",
        labelNl: "Type dienstverlening",
        labelEn: "Service type",
        type: "select",
        options: [
          "Cocktail uniquement",
          "Repas assis",
          "Buffet dînatoire",
          "Cocktail + Repas",
          "À définir",
        ],
        optionsNl: [
          "Enkel cocktail",
          "Zitdiner",
          "Dinerbuffet",
          "Cocktail + Diner",
          "Nader te bepalen",
        ],
        optionsEn: [
          "Cocktail only",
          "Seated dinner",
          "Dinner buffet",
          "Cocktail + Dinner",
          "To be defined",
        ],
      },
      {
        key: "allergies",
        labelFr: "Allergies / régimes alimentaires",
        labelNl: "Allergieën / dieetwensen",
        labelEn: "Allergies / dietary requirements",
        type: "textarea",
        placeholder: "ex: 10 végétariens, 3 allergiques aux noix…",
      },
    ],
  },
  "Coiffure & Maquillage": {
    suggestedServices: [
      "Coiffure mariée",
      "Maquillage mariée",
      "Essai coiffure",
      "Essai maquillage",
      "Coiffure cortège",
      "Maquillage cortège",
    ],
    quoteFields: [
      {
        key: "personsCount",
        labelFr: "Nombre de personnes à prendre en charge",
        labelNl: "Aantal te verzorgen personen",
        labelEn: "Number of people to attend to",
        type: "number",
        placeholder: "ex: 4",
      },
      {
        key: "trialNeeded",
        labelFr: "Essai souhaité avant le jour J ?",
        labelNl: "Proefbeurt gewenst voor de dag zelf?",
        labelEn: "Trial session desired before the wedding day?",
        type: "select",
        options: ["Non", "Oui"],
        optionsNl: ["Nee", "Ja"],
        optionsEn: ["No", "Yes"],
      },
      {
        key: "hairType",
        labelFr: "Type de cheveux",
        labelNl: "Haartype",
        labelEn: "Hair type",
        type: "select",
        options: [
          "Cheveux naturels afro",
          "Tresses / nattes",
          "Extensions",
          "Cheveux lisses / mixtes",
          "Autre",
        ],
        optionsNl: [
          "Natuurlijk afro haar",
          "Vlechten / gevlochten haar",
          "Extensions",
          "Stijl / gemengd haar",
          "Andere",
        ],
        optionsEn: [
          "Natural afro hair",
          "Braids / plaits",
          "Extensions",
          "Straight / mixed hair",
          "Other",
        ],
      },
    ],
  },
  "Robe de mariée": {
    suggestedServices: [
      "Robe sur-mesure",
      "Robe prêt-à-porter",
      "Retouches",
      "Accessoires (voile, bijoux)",
      "Tenue traditionnelle",
      "Location",
    ],
    quoteFields: [
      {
        key: "robeStyle",
        labelFr: "Style de robe souhaité",
        labelNl: "Gewenste jurk stijl",
        labelEn: "Desired dress style",
        type: "select",
        options: [
          "Princesse / Ballgown",
          "Sirène / Mermaid",
          "A-line",
          "Courte / Mini",
          "Tenue traditionnelle",
          "Mixte moderne-traditionnel",
        ],
        optionsNl: [
          "Prinses / Ballgown",
          "Zeemeermin / Mermaid",
          "A-lijn",
          "Kort / Mini",
          "Traditionele kledij",
          "Modern-traditionele mix",
        ],
        optionsEn: [
          "Princess / Ballgown",
          "Mermaid",
          "A-line",
          "Short / Mini",
          "Traditional outfit",
          "Modern-traditional mix",
        ],
      },
      {
        key: "budget",
        labelFr: "Budget indicatif pour la robe",
        labelNl: "Indicatief budget voor de jurk",
        labelEn: "Indicative budget for the dress",
        type: "select",
        options: ["< 500 €", "500 – 1 000 €", "1 000 – 2 000 €", "2 000 – 3 000 €", "> 3 000 €"],
      },
    ],
  },
  Transport: {
    suggestedServices: [
      "Voiture de mariage",
      "Navette invités",
      "Limousine",
      "Van de cérémonie",
      "Location de véhicule",
    ],
    quoteFields: [
      {
        key: "vehicleType",
        labelFr: "Type de véhicule souhaité",
        labelNl: "Gewenst voertuigtype",
        labelEn: "Desired vehicle type",
        type: "select",
        options: ["Voiture de prestige", "Limousine", "Vintage / Classique", "Van / Minibus", "Autre"],
        optionsNl: ["Prestigewagen", "Limousine", "Vintage / Klassiek", "Van / Minibus", "Andere"],
        optionsEn: ["Prestige car", "Limousine", "Vintage / Classic", "Van / Minibus", "Other"],
      },
      {
        key: "personsCount",
        labelFr: "Nombre de personnes à transporter",
        labelNl: "Aantal te vervoeren personen",
        labelEn: "Number of people to transport",
        type: "number",
        placeholder: "ex: 8",
      },
    ],
  },
  Invitations: {
    suggestedServices: [
      "Faire-part de mariage",
      "Save the date",
      "Menu & programme",
      "Plan de table",
      "Papeterie sur-mesure",
      "Design numérique",
    ],
    quoteFields: [
      {
        key: "quantity",
        labelFr: "Quantité estimée",
        labelNl: "Geschatte hoeveelheid",
        labelEn: "Estimated quantity",
        type: "number",
        placeholder: "ex: 100",
      },
      {
        key: "printOrDigital",
        labelFr: "Format souhaité",
        labelNl: "Gewenst formaat",
        labelEn: "Desired format",
        type: "select",
        options: ["Papier imprimé", "Numérique", "Les deux"],
        optionsNl: ["Gedrukt papier", "Digitaal", "Beide"],
        optionsEn: ["Printed paper", "Digital", "Both"],
      },
    ],
  },
  "Coordinateur de mariage": {
    suggestedServices: [
      "Coordination complète",
      "Coordination Jour J",
      "Coordination partielle",
      "Gestion & sélection des prestataires",
      "Suivi du planning et du budget",
      "Rétroplanning personnalisé",
      "Coordination cérémonie traditionnelle",
      "Présence & coordination le Jour J",
    ],
    quoteFields: [
      {
        key: "coordinationType",
        labelFr: "Type de coordination",
        labelNl: "Type coördinatie",
        labelEn: "Coordination type",
        type: "select",
        options: [
          "Coordination complète (de A à Z)",
          "Coordination partielle",
          "Coordination Jour J uniquement",
          "À définir",
        ],
        optionsNl: [
          "Volledige coördinatie (van A tot Z)",
          "Gedeeltelijke coördinatie",
          "Coördinatie dag zelf",
          "Nader te bepalen",
        ],
        optionsEn: [
          "Full coordination (A to Z)",
          "Partial coordination",
          "Day-of coordination only",
          "To be defined",
        ],
        required: true,
      },
      {
        key: "guestCount",
        labelFr: "Nombre d'invités estimé",
        labelNl: "Geschat aantal gasten",
        labelEn: "Estimated guest count",
        type: "number",
        placeholder: "ex: 150",
      },
      {
        key: "budget",
        labelFr: "Budget global du mariage",
        labelNl: "Totaalbudget bruiloft",
        labelEn: "Overall wedding budget",
        type: "select",
        options: [
          "< 10 000 €",
          "10 000 – 20 000 €",
          "20 000 – 40 000 €",
          "40 000 – 70 000 €",
          "> 70 000 €",
          "À définir",
        ],
        optionsNl: [
          "< € 10.000",
          "€ 10.000 – € 20.000",
          "€ 20.000 – € 40.000",
          "€ 40.000 – € 70.000",
          "> € 70.000",
          "Nader te bepalen",
        ],
        optionsEn: [
          "< €10,000",
          "€10,000 – €20,000",
          "€20,000 – €40,000",
          "€40,000 – €70,000",
          "> €70,000",
          "To be defined",
        ],
      },
      {
        key: "traditionalCeremony",
        labelFr: "Cérémonie traditionnelle prévue ?",
        labelNl: "Traditionele ceremonie gepland?",
        labelEn: "Traditional ceremony planned?",
        type: "select",
        options: ["Non", "Oui", "À définir"],
        optionsNl: ["Nee", "Ja", "Nader te bepalen"],
        optionsEn: ["No", "Yes", "To be defined"],
      },
    ],
  },
  "Wedding Designer": {
    suggestedServices: [
      "Direction artistique complète",
      "Moodboard & identité visuelle",
      "Scénographie & décoration globale",
      "Design floral",
      "Sélection & coordination décorateurs",
      "Mise en scène cérémonie",
      "Design table & réception",
      "Éclairages & ambiance",
    ],
    quoteFields: [
      {
        key: "designStyle",
        labelFr: "Style & ambiance souhaités",
        labelNl: "Gewenste stijl & sfeer",
        labelEn: "Desired style & atmosphere",
        type: "select",
        options: [
          "Luxe / Glamour",
          "Bohème / Naturel",
          "Traditionnel africain",
          "Moderne & épuré",
          "Floral & romantique",
          "Fusion culturelle",
          "À définir avec le designer",
        ],
        optionsNl: [
          "Luxe / Glamour",
          "Bohemien / Natuurlijk",
          "Traditioneel Afrikaans",
          "Modern & strak",
          "Bloemen & romantisch",
          "Culturele fusie",
          "Samen met de designer bepalen",
        ],
        optionsEn: [
          "Luxury / Glamour",
          "Bohemian / Natural",
          "Traditional African",
          "Modern & minimalist",
          "Floral & romantic",
          "Cultural fusion",
          "To be defined with the designer",
        ],
        required: true,
      },
      {
        key: "guestCount",
        labelFr: "Nombre d'invités",
        labelNl: "Aantal gasten",
        labelEn: "Number of guests",
        type: "number",
        placeholder: "ex: 150",
      },
      {
        key: "decoBudget",
        labelFr: "Budget décoration & design",
        labelNl: "Decoratie- & designbudget",
        labelEn: "Decoration & design budget",
        type: "select",
        options: [
          "< 3 000 €",
          "3 000 – 8 000 €",
          "8 000 – 15 000 €",
          "15 000 – 30 000 €",
          "> 30 000 €",
          "À définir",
        ],
        optionsNl: [
          "< € 3.000",
          "€ 3.000 – € 8.000",
          "€ 8.000 – € 15.000",
          "€ 15.000 – € 30.000",
          "> € 30.000",
          "Nader te bepalen",
        ],
        optionsEn: [
          "< €3,000",
          "€3,000 – €8,000",
          "€8,000 – €15,000",
          "€15,000 – €30,000",
          "> €30,000",
          "To be defined",
        ],
      },
      {
        key: "moodboardReady",
        labelFr: "Avez-vous déjà un moodboard ou des inspirations ?",
        labelNl: "Heeft u al een moodboard of inspiraties?",
        labelEn: "Do you already have a moodboard or inspirations?",
        type: "select",
        options: ["Non, on part de zéro", "Quelques idées", "Oui, moodboard complet"],
        optionsNl: ["Nee, we beginnen van nul", "Enkele ideeën", "Ja, volledig moodboard"],
        optionsEn: ["No, starting from scratch", "A few ideas", "Yes, full moodboard"],
      },
    ],
  },
};

export function getCategoryConfig(category: string): CategoryConfig | null {
  return CATEGORY_CONFIG[category] ?? null;
}

const CATEGORY_HERO_IMAGES: Record<string, string> = {
  "Salle & lieu de réception": "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=80&auto=format&fit=crop",
  "Traiteur": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80&auto=format&fit=crop",
  "Wedding planner & coordination": "https://images.unsplash.com/photo-1511795409834-432f7b1728b2?w=1200&q=80&auto=format&fit=crop",
  "Décoration & wedding design": "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80&auto=format&fit=crop",
  "Fleurs & décoration florale": "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200&q=80&auto=format&fit=crop",
  "Photo & vidéo": "https://images.unsplash.com/photo-1537907690979-68b1b98e0ba5?w=1200&q=80&auto=format&fit=crop",
  "Content creator": "https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=1200&q=80&auto=format&fit=crop",
  "DJ": "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=1200&q=80&auto=format&fit=crop",
  "MC & Animation": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80&auto=format&fit=crop",
  "Sonorisation, lumière & effets spéciaux": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80&auto=format&fit=crop",
  "Wedding cake & dessert": "https://images.unsplash.com/photo-1568051243857-b40626d8f66b?w=1200&q=80&auto=format&fit=crop",
  "Maquillage": "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&q=80&auto=format&fit=crop",
  "Coiffure": "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=1200&q=80&auto=format&fit=crop",
  "Tenues & accessoires": "https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=1200&q=80&auto=format&fit=crop",
  "Hôtesses & serveurs": "https://images.unsplash.com/photo-1555244162-803834f70033?w=1200&q=80&auto=format&fit=crop",
  "Personnel événementiel": "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=1200&q=80&auto=format&fit=crop",
  "Transport, voitures & navettes": "https://images.unsplash.com/photo-1555684598-8ace31564f25?w=1200&q=80&auto=format&fit=crop",
  "Papeterie, impression & signalétique": "https://images.unsplash.com/photo-1607532941433-304659e8198a?w=1200&q=80&auto=format&fit=crop",
  "Location de matériel, mobilier & logistique": "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=1200&q=80&auto=format&fit=crop",
  "Photobooth, miroir photo & animations photos": "https://images.unsplash.com/photo-1498612753354-772a30629934?w=1200&q=80&auto=format&fit=crop",
  "Artistes live & musiciens": "https://images.unsplash.com/photo-1470019693664-1d202d2c0907?w=1200&q=80&auto=format&fit=crop",
  "Danseurs & animations culturelles": "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=1200&q=80&auto=format&fit=crop",
  "Officiant": "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&q=80&auto=format&fit=crop",
  "Cadeaux invités & souvenirs personnalisés": "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=1200&q=80&auto=format&fit=crop",
  "Hébergement, hôtel & logements invités": "https://images.unsplash.com/photo-1566073771259-470c3e0571f2?w=1200&q=80&auto=format&fit=crop",
  "Voyage de noces & organisation lune de miel": "https://images.unsplash.com/photo-1518599807935-37015b9cefcb?w=1200&q=80&auto=format&fit=crop",
  "Services enfants & garderie événementielle": "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=1200&q=80&auto=format&fit=crop",
  "Autre service": "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=80&auto=format&fit=crop",
  "Vidéo": "https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=1200&q=80&auto=format&fit=crop",
  "DJ & Animation": "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=1200&q=80&auto=format&fit=crop",
  "Décoration": "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80&auto=format&fit=crop",
  "Coiffure & Maquillage": "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&q=80&auto=format&fit=crop",
  "Robe de mariée": "https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=1200&q=80&auto=format&fit=crop",
  "Coordinateur de mariage": "https://images.unsplash.com/photo-1511795409834-432f7b1728b2?w=1200&q=80&auto=format&fit=crop",
  "Wedding Designer": "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80&auto=format&fit=crop",
  "Photographie": "https://images.unsplash.com/photo-1537907690979-68b1b98e0ba5?w=1200&q=80&auto=format&fit=crop",
};

const CATEGORY_HERO_FALLBACK = "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=80&auto=format&fit=crop";

export function getCategoryHeroUrl(category: string): string {
  return CATEGORY_HERO_IMAGES[category] ?? CATEGORY_HERO_FALLBACK;
}

export function getCategoryLabel(
  field: CategoryField,
  lang: string,
): string {
  const l = lang.slice(0, 2);
  if (l === "nl") return field.labelNl;
  if (l === "en") return field.labelEn;
  return field.labelFr;
}

export function getCategoryOptions(
  field: CategoryField,
  lang: string,
): string[] {
  if (!field.options) return [];
  const l = lang.slice(0, 2);
  if (l === "nl" && field.optionsNl) return field.optionsNl;
  if (l === "en" && field.optionsEn) return field.optionsEn;
  return field.options;
}
