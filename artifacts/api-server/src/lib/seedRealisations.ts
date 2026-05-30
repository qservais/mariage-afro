import { db, realisationsTable } from "@workspace/db";
import { count } from "drizzle-orm";
import { logger } from "./logger";

const REALISATIONS_SEED = [
  {
    brideName: "Gloria",
    groomName: "Moïse",
    weddingType: "Afro-européen",
    venueName: "",
    city: "Belgique",
    weddingDate: null,
    description:
      "Deux cultures, une seule histoire d'amour. Un mariage élégant et rempli d'émotions, célébrant l'union de deux cultures et de deux familles. Entre tradition, modernité et moments inoubliables, cette journée reflète parfaitement l'univers Mariage Afro : authentique, raffiné et profondément humain.",
    coverImage: "/images/gloria-moise-poster.webp",
    gallery: [
      "/images/g-m-00552.webp",
      "/images/g-m-00569.webp",
      "/images/g-m-00663.webp",
      "/images/g-m-00756.webp",
      "/images/g-m-00838.webp",
      "/images/g-m-00895.webp",
      "/images/g-m-00928-2.webp",
      "/images/g-m-00932.webp",
      "/images/g-m-01075.webp",
      "/images/g-m-01084.webp",
      "/images/g-m-01121.webp",
      "/images/g-m-01182.webp",
      "/images/g-m-01264.webp",
      "/images/mielmaggm-156of162.webp",
      "/images/mielmagg-m-162of162-1.webp",
    ],
    videoCouple: null,
    videoTeaser: "/videos/gloria-moise-teaser.mp4",
    active: true,
    featured: true,
  },
  {
    brideName: "Michaela",
    groomName: "Stephano",
    weddingType: "Mixte",
    venueName: "",
    city: "Belgique",
    weddingDate: null,
    description:
      "L'amour au-delà des origines et des frontières. Une célébration vibrante, chic et pleine de vie, où chaque détail a été pensé pour créer une expérience unique pour les mariés et leurs invités. Un mariage à l'image de leur histoire : passionné, moderne et intemporel.",
    coverImage: "/images/michaela-stephano-poster.webp",
    gallery: [
      "/images/michaela-stephano-poster.webp",
      "/images/m-sj2-05790.webp",
      "/images/m-sj2-05876.webp",
      "/images/dsc05077.webp",
      "/images/dsc05154.webp",
      "/images/dsc05156.webp",
      "/images/dsc05253.webp",
      "/images/dsc05263.webp",
      "/images/dsc05353.webp",
      "/images/dsc05361.webp",
      "/images/dsc05389.webp",
      "/images/dsc05608.webp",
      "/images/dsc05609.webp",
    ],
    videoCouple: null,
    videoTeaser: "/videos/michaela-stephano-teaser.mp4",
    active: true,
    featured: false,
  },
  {
    brideName: "Carmel",
    groomName: "Will",
    weddingType: "Afro-mixte",
    venueName: "",
    city: "Belgique",
    weddingDate: null,
    description:
      "Quand deux univers se rencontrent pour ne faire qu'un. Un mariage rempli d'amour, d'élégance et de belles énergies. Entre émotions fortes, ambiance festive et moments de partage, cette journée illustre parfaitement la vision de Mariage Afro : créer des expériences mémorables autour des cultures afro et mixtes.",
    coverImage: "/images/c-g-170.webp",
    gallery: [
      "/images/c-g-170.webp",
      "/images/new-project-41.webp",
      "/images/new-project-42.webp",
    ],
    videoCouple: null,
    videoTeaser: "/videos/carmel-will-teaser.mp4",
    active: true,
    featured: false,
  },
];

export async function seedRealisations(): Promise<void> {
  const [{ value: existing }] = await db
    .select({ value: count() })
    .from(realisationsTable);

  if (Number(existing) > 0) {
    logger.info({ existing }, "Realisations already seeded — skipping");
    return;
  }

  await db.insert(realisationsTable).values(REALISATIONS_SEED);
  logger.info({ count: REALISATIONS_SEED.length }, "Realisations seeded");
}
