export type CategoryFieldType = "text" | "number" | "select" | "textarea";

export interface CategoryField {
  key: string;
  labelFr: string;
  labelNl: string;
  labelEn: string;
  type: CategoryFieldType;
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

export interface CategoryConfig {
  suggestedServices: string[];
  quoteFields: CategoryField[];
}

export const VENDOR_CATEGORIES: string[] = [
  "Photographie",
  "Vidéo",
  "DJ & Animation",
  "Décoration",
  "Traiteur",
  "Coiffure & Maquillage",
  "Robe de mariée",
  "Transport",
  "Invitations",
  "Autre",
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
      },
      {
        key: "videoAlso",
        labelFr: "Souhaitez-vous aussi une vidéo ?",
        labelNl: "Wilt u ook een video?",
        labelEn: "Would you also like video?",
        type: "select",
        options: ["Non", "Oui, clip court", "Oui, film complet"],
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
      },
      {
        key: "drone",
        labelFr: "Drone souhaité ?",
        labelNl: "Drone gewenst?",
        labelEn: "Drone desired?",
        type: "select",
        options: ["Non", "Oui"],
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
      },
      {
        key: "ceremony",
        labelFr: "Sonorisation cérémonie incluse ?",
        labelNl: "Ceremonie geluidsinstallatie inbegrepen?",
        labelEn: "Ceremony sound system included?",
        type: "select",
        options: ["Non", "Oui"],
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
      },
    ],
  },
};

export function getCategoryConfig(category: string): CategoryConfig | null {
  return CATEGORY_CONFIG[category] ?? null;
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
