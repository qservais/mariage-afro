/**
 * Seed script — Mariage Afro demo data
 * Run: pnpm --filter @workspace/scripts run seed
 */
import {
  db,
  marketplaceVendorsTable,
  marketplaceVenuesTable,
  realisationsTable,
} from "@workspace/db";

// ───────── VENDORS ─────────

const vendors = [
  {
    name: "Lumière d'Ebène Photography",
    category: "Photographie",
    city: "Bruxelles",
    tagline: "Capturer l'émotion authentique de votre union",
    description:
      "Studio spécialisé dans les mariages afro-caribéens et mixtes depuis 12 ans. Nous maîtrisons la lumière pour sublimer toutes les carnations et les tenues traditionnelles. Portfolio de plus de 400 mariages en Belgique, France et Côte d'Ivoire.",
    services: ["Reportage complet", "Séance engagement", "Album premium", "Drone"],
    images: [
      "https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?w=800",
      "https://images.pexels.com/photos/1043902/pexels-photo-1043902.jpeg?w=800",
    ],
    coverImage: "https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?w=1200",
    verified: true,
    active: true,
    rating: 5,
    website: "https://lumiere-ebene.be",
    phone: "+32 476 12 34 56",
    email: "contact@lumiere-ebene.be",
  },
  {
    name: "AfroVision Films",
    category: "Vidéo & Film",
    city: "Liège",
    tagline: "Votre histoire, notre cinéma",
    description:
      "Production vidéo haut de gamme spécialisée dans les cérémonies traditionnelles et civiles. Films cinématographiques, drone, multi-caméras. Diffusion en direct pour la famille à l'international disponible.",
    services: ["Film cinéma 4K", "Teaser J+1", "Live streaming", "Clip musical mariage"],
    images: [
      "https://images.pexels.com/photos/3014853/pexels-photo-3014853.jpeg?w=800",
    ],
    coverImage: "https://images.pexels.com/photos/3014853/pexels-photo-3014853.jpeg?w=1200",
    verified: true,
    active: true,
    rating: 5,
    website: "https://afrovision.be",
    phone: "+32 456 78 90 12",
    email: "info@afrovision.be",
  },
  {
    name: "DJ Kofi & Animations",
    category: "DJ & Animation",
    city: "Bruxelles",
    tagline: "Afrobeats, coupé-décalé, ndombolo — toutes les ambiances",
    description:
      "DJ professionnel depuis 15 ans spécialisé dans les soirées afro-belges. Répertoire couvrant afrobeats, ndombolo, coupé-décalé, kizomba, zouk, reggaeton et variété internationale. Matériel son et lumière professionnel.",
    services: ["Soirée DJ", "Animer cérémonie", "Son & lumière", "Écran LED"],
    images: [
      "https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?w=800",
    ],
    coverImage: "https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?w=1200",
    verified: true,
    active: true,
    rating: 5,
    phone: "+32 489 34 56 78",
    email: "djkofi@gmail.com",
  },
  {
    name: "Fleurs d'Afrique",
    category: "Décoration & Fleurs",
    city: "Gand",
    tagline: "Décors inspirés des traditions africaines et européennes",
    description:
      "Atelier de décoration florale et événementielle. Spécialité : mariage en couleurs vives, tissu wax, composition florale exotique. Décoration de salle, arche florale, tables d'honneur. Service complet de mise en place et reprise.",
    services: ["Décoration salle", "Arche florale", "Bouquets de mariée", "Location mobilier"],
    images: [
      "https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?w=800",
      "https://images.pexels.com/photos/169198/pexels-photo-169198.jpeg?w=800",
    ],
    coverImage: "https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?w=1200",
    verified: true,
    active: true,
    rating: 5,
    website: "https://fleurs-afrique.be",
    phone: "+32 477 22 33 44",
    email: "contact@fleurs-afrique.be",
  },
  {
    name: "Saveurs du Continent",
    category: "Catering & Traiteur",
    city: "Charleroi",
    tagline: "Cuisine africaine et fusion pour vos grandes occasions",
    description:
      "Traiteur spécialisé dans la cuisine africaine authentique et la fusion afro-belge. Thiéboudienne, poulet yassa, ndolé, attiéké, brochettes, buffets chauds et froids. Équipe de 20 personnes pour des réceptions de 50 à 600 convives.",
    services: ["Buffet africain", "Menu assis 5 services", "Cocktail dînatoire", "Bar à jus"],
    images: [
      "https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?w=800",
    ],
    coverImage: "https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?w=1200",
    verified: true,
    active: true,
    rating: 5,
    website: "https://saveurs-continent.be",
    phone: "+32 460 55 66 77",
    email: "reservations@saveurs-continent.be",
  },
  {
    name: "Beauté Royale Brussels",
    category: "Coiffure & Maquillage",
    city: "Bruxelles",
    tagline: "Sublimer chaque mariée, célébrer chaque beauté",
    description:
      "Studio beauté de luxe spécialisé dans les mariées africaines, métissées et mixtes. Coiffures afro, tresses, tissages, extensions, maquillage airbrush longue tenue. Équipe multilingue (FR/EN/NL). Service à domicile ou en salon.",
    services: ["Coiffure mariée", "Maquillage airbrush", "Essai beauté", "Cortège complet"],
    images: [
      "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?w=800",
    ],
    coverImage: "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?w=1200",
    verified: false,
    active: true,
    rating: 5,
    phone: "+32 472 88 99 00",
    email: "info@beaute-royale.be",
  },
  {
    name: "VTC Prestige Belgique",
    category: "Transport & Limousines",
    city: "Bruxelles",
    tagline: "Arrivez en majesté le jour le plus beau de votre vie",
    description:
      "Flotte de véhicules de luxe : Mercedes Classe S, Rolls-Royce, limousines américaines et minibus VIP. Chauffeurs en costume, champagne offert, tapis rouge. Prise en charge dans toute la Belgique. Devis gratuit sous 24h.",
    services: ["Voiture des mariés", "Cortège", "Minibus invités", "Transferts aéroport"],
    images: [
      "https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?w=800",
    ],
    coverImage: "https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?w=1200",
    verified: true,
    active: true,
    rating: 5,
    phone: "+32 492 11 22 33",
    email: "reservations@vtc-prestige.be",
  },
  {
    name: "Palais des Congrès Events",
    category: "Location de salle",
    city: "Namur",
    tagline: "Salles modulables pour vos cérémonies et réceptions",
    description:
      "Complexe événementiel avec 4 salles de 80 à 800 personnes. Cuisine professionnelle, vestiaires, parking 500 places. Équipe technique sur place. Partenariats avec les meilleurs traiteurs halal et africains de Wallonie.",
    services: ["Location salle", "Catering intégré", "Technique son/lumière", "Coordination"],
    images: [
      "https://images.pexels.com/photos/169193/pexels-photo-169193.jpeg?w=800",
    ],
    coverImage: "https://images.pexels.com/photos/169193/pexels-photo-169193.jpeg?w=1200",
    verified: true,
    active: true,
    rating: 4,
    website: "https://palais-congres-namur.be",
    phone: "+32 081 77 88 99",
    email: "events@palais-namur.be",
  },
];

// ───────── VENUES ─────────

const venues = [
  {
    name: "Château de Tertre",
    city: "Mons",
    capacity: "50–350 personnes",
    style: "Château historique",
    description:
      "Château du XVIIIe siècle entouré de 8 hectares de parc. Grande salle de réception avec parquet de bois noble, lustres en cristal et terrasse panoramique. Hébergement sur place pour les mariés et leurs proches. Cuisine étoilée disponible.",
    options: ["Parc privatisé", "Suite nuptiale", "Hébergement", "Chapelle", "Parking VIP"],
    images: [
      "https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?w=800",
      "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?w=800",
    ],
    coverImage: "https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?w=1200",
    active: true,
  },
  {
    name: "Le Domaine du Lac Noir",
    city: "Gerpinnes",
    capacity: "80–500 personnes",
    style: "Domaine contemporain",
    description:
      "Complexe événementiel moderne au bord d'un lac privé. Architecture design alliant acier, verre et bois. Grande terrasse sur l'eau, piste de danse intérieure/extérieure. Cuisine équipée professionnelle. Idéal pour mariages afro et mixtes.",
    options: ["Lac privatisé", "Ponton", "Feu d'artifice", "Son & lumière", "Nuit romantique"],
    images: [
      "https://images.pexels.com/photos/1024985/pexels-photo-1024985.jpeg?w=800",
    ],
    coverImage: "https://images.pexels.com/photos/1024985/pexels-photo-1024985.jpeg?w=1200",
    active: true,
  },
  {
    name: "Salle des Fêtes d'Afrique Palace",
    city: "Bruxelles",
    capacity: "150–800 personnes",
    style: "Salle des fêtes",
    description:
      "Salle événementielle emblématique de la communauté afro-belge. Décor en or et ivoire, piste de danse XXL, bar modulable. Cuisine africaine autorisée, scène pour orchestre live, salles de préparation pour les mariés.",
    options: ["Cuisine afro autorisée", "Scène musicale", "Bar intégré", "Salon VIP", "Parking"],
    images: [
      "https://images.pexels.com/photos/169197/pexels-photo-169197.jpeg?w=800",
    ],
    coverImage: "https://images.pexels.com/photos/169197/pexels-photo-169197.jpeg?w=1200",
    active: true,
  },
  {
    name: "Villa Royale de Laeken",
    city: "Bruxelles",
    capacity: "30–150 personnes",
    style: "Villa de luxe",
    description:
      "Villa Art Déco des années 1920 au cœur d'un jardin privé de 2 hectares. Idéale pour mariages intimistes et intimes. Salon d'apparat, bibliothèque transformable, pergola fleurie. Service butler sur mesure.",
    options: ["Jardin privatisé", "Pergola", "Service butler", "Piscine", "Hébergement 10 pers"],
    images: [
      "https://images.pexels.com/photos/1643384/pexels-photo-1643384.jpeg?w=800",
    ],
    coverImage: "https://images.pexels.com/photos/1643384/pexels-photo-1643384.jpeg?w=1200",
    active: true,
  },
  {
    name: "Warehouse Antwerp Events",
    city: "Anvers",
    capacity: "200–1200 personnes",
    style: "Industriel chic",
    description:
      "Ancienne entrepôt portuaire transformée en espace événementiel branché. Briques apparentes, poutres métalliques, baies vitrées sur l'Escaut. Espace unique pour mariages festifs et modernes. Décoration entièrement personnalisable.",
    options: ["Vue sur l'Escaut", "Scène pro", "Installations lumière", "Catering libre", "Bar"],
    images: [
      "https://images.pexels.com/photos/1058277/pexels-photo-1058277.jpeg?w=800",
    ],
    coverImage: "https://images.pexels.com/photos/1058277/pexels-photo-1058277.jpeg?w=1200",
    active: true,
  },
];

// ───────── REALISATIONS ─────────

const realisations = [
  {
    brideName: "Amara",
    groomName: "Thomas",
    weddingType: "Afro-Belge",
    venueName: "Château de Tertre",
    city: "Mons",
    weddingDate: "2024-08-17",
    description:
      "Un mariage féerique qui a réuni deux cultures sous le soleil d'août. Cérémonie traditionnelle guinéenne le matin, échange de vœux civil l'après-midi, puis une soirée dansante jusqu'à l'aube sur des rythmes afrobeats et variété belge. 320 invités, deux robes de mariée, une magie inoubliable.",
    coverImage: "https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?w=1200",
    gallery: [
      "https://images.pexels.com/photos/1043902/pexels-photo-1043902.jpeg?w=800",
      "https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?w=800",
    ],
    active: true,
    featured: true,
  },
  {
    brideName: "Fatou",
    groomName: "Maxime",
    weddingType: "Sénégalo-Belge",
    venueName: "Le Domaine du Lac Noir",
    city: "Gerpinnes",
    weddingDate: "2024-06-29",
    description:
      "Fatou et Maxime ont choisi un cadre naturel exceptionnel pour leur union. Cérémonie en plein air au bord du lac, dinner de gala avec menu fusion créole-belge, feu d'artifice sur l'eau à minuit. Un mariage romantique et coloré qui a ému 180 invités venus de 12 pays.",
    coverImage: "https://images.pexels.com/photos/3014853/pexels-photo-3014853.jpeg?w=1200",
    gallery: [
      "https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?w=800",
    ],
    active: true,
    featured: true,
  },
  {
    brideName: "Grace",
    groomName: "Pierre-Antoine",
    weddingType: "Congolo-Belge",
    venueName: "Salle Afrique Palace",
    city: "Bruxelles",
    weddingDate: "2023-11-11",
    description:
      "Le mariage de Grace et Pierre-Antoine a été une célébration explosive de la culture congolaise ! Cérémonie de dot traditionnelle (lobola) le vendredi, mariage civil le samedi avec 420 convives. DJ Kofi a fait danser tout le monde jusqu'à 6h du matin. Ndolé, poulet moambe et gâteau 5 étages au menu.",
    coverImage: "https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?w=1200",
    gallery: [
      "https://images.pexels.com/photos/169197/pexels-photo-169197.jpeg?w=800",
    ],
    active: true,
    featured: false,
  },
  {
    brideName: "Aïssatou",
    groomName: "Kevin",
    weddingType: "Guinéo-Belge",
    venueName: "Villa Royale de Laeken",
    city: "Bruxelles",
    weddingDate: "2024-05-04",
    description:
      "Un mariage intime et raffiné pour Aïssatou et Kevin. Seulement 85 invités triés sur le volet dans la Villa Royale. Tenue en bazin brode pour la mariée, djellaba pour les parents. Photographe Lumière d'Ebène a immortalisé chaque moment dans le jardin fleuri.",
    coverImage: "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?w=1200",
    gallery: [
      "https://images.pexels.com/photos/1643384/pexels-photo-1643384.jpeg?w=800",
    ],
    active: true,
    featured: false,
  },
];

// ───────── RUN ─────────

async function main() {
  console.log("🌱 Seeding marketplace data...");

  // Vendors
  const existingVendors = await db.select().from(marketplaceVendorsTable);
  if (existingVendors.length === 0) {
    await db.insert(marketplaceVendorsTable).values(vendors);
    console.log(`✅ Inserted ${vendors.length} vendors`);
  } else {
    console.log(`⏭  Vendors already seeded (${existingVendors.length} found), skipping`);
  }

  // Venues
  const existingVenues = await db.select().from(marketplaceVenuesTable);
  if (existingVenues.length === 0) {
    await db.insert(marketplaceVenuesTable).values(venues);
    console.log(`✅ Inserted ${venues.length} venues`);
  } else {
    console.log(`⏭  Venues already seeded (${existingVenues.length} found), skipping`);
  }

  // Réalisations
  const existingRealisations = await db.select().from(realisationsTable);
  if (existingRealisations.length === 0) {
    await db.insert(realisationsTable).values(realisations);
    console.log(`✅ Inserted ${realisations.length} réalisations`);
  } else {
    console.log(`⏭  Réalisations already seeded (${existingRealisations.length} found), skipping`);
  }

  console.log("🎉 Seed complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
