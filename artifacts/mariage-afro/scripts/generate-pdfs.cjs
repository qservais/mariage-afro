/* eslint-disable */
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const OUT_DIR = path.join(__dirname, "..", "public");
fs.mkdirSync(OUT_DIR, { recursive: true });

const BORDEAUX = "#68191e";
const CREAM = "#fff4e4";
const GOLD = "#c9a96e";
const WINE_DEEP = "#1f1416";

function makeDoc() {
  return new PDFDocument({ size: "A4", margin: 56, info: { Title: "Mariage Afro", Author: "Mariage Afro" } });
}

function cover(doc, title, subtitle) {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(CREAM);
  doc.rect(0, 0, doc.page.width, 8).fill(BORDEAUX);
  doc.rect(0, doc.page.height - 8, doc.page.width, 8).fill(GOLD);
  doc.fillColor(BORDEAUX).font("Helvetica-Bold").fontSize(34).text(title, 56, 220, { width: doc.page.width - 112 });
  doc.moveDown(0.6);
  doc.fillColor(WINE_DEEP).font("Helvetica").fontSize(14).text(subtitle, { width: doc.page.width - 112 });
  doc.fillColor(GOLD).font("Helvetica-Oblique").fontSize(11).text("Mariage Afro — mariages afro & mixtes en Belgique", 56, doc.page.height - 80);
}

function section(doc, heading) {
  doc.addPage().rect(0, 0, doc.page.width, doc.page.height).fill("#ffffff");
  doc.fillColor(BORDEAUX).font("Helvetica-Bold").fontSize(20).text(heading, 56, 64);
  doc.moveTo(56, 96).lineTo(doc.page.width - 56, 96).strokeColor(GOLD).lineWidth(1).stroke();
  doc.moveDown(1.2);
  doc.fillColor(WINE_DEEP).font("Helvetica").fontSize(11);
}

function bullets(doc, items) {
  for (const item of items) {
    doc.fillColor(GOLD).text("•  ", { continued: true });
    doc.fillColor(WINE_DEEP).text(item);
    doc.moveDown(0.3);
  }
}

function paragraph(doc, text) {
  doc.fillColor(WINE_DEEP).font("Helvetica").fontSize(11).text(text, { align: "justify" });
  doc.moveDown(0.6);
}

// ---- Guide Mariage Afro ----
{
  const doc = makeDoc();
  doc.pipe(fs.createWriteStream(path.join(OUT_DIR, "guide-mariage-afro.pdf")));
  cover(doc, "Guide du Mariage Afro", "Traditions, conseils et planning pour un mariage afro ou mixte réussi en Belgique.");

  section(doc, "1. Choisir vos traditions");
  paragraph(doc, "Mariage afro ou mixte : du versement de la dot à la cérémonie laïque ou religieuse, l'objectif est de tisser un récit qui célèbre toutes les origines de votre couple. Identifiez 3 à 5 rituels essentiels et donnez-leur une place centrale dans la journée.");
  bullets(doc, [
    "La dot et la rencontre des familles (intimité, symbolique).",
    "La cérémonie civile en Belgique : prévoir 2 à 4 mois de délai.",
    "Le rituel religieux ou laïque : alliance, libation, bénédiction.",
    "Les danses et tenues traditionnelles : prévoir un changement.",
  ]);

  section(doc, "2. Rétroplanning 12 mois");
  bullets(doc, [
    "12 mois : budget, date, liste d'invités, salle.",
    "9 mois : traiteur afro, photographe, DJ/groupe.",
    "6 mois : tenues, faire-part, déco et fleurs.",
    "3 mois : essais coiffure & make-up, plan de table.",
    "1 mois : confirmation prestataires, derniers détails.",
    "Semaine J : briefing, livraisons, kit d'urgence.",
  ]);

  section(doc, "3. Choisir vos prestataires");
  paragraph(doc, "Privilégiez les prestataires qui comprennent les codes du mariage afro : traiteurs maîtrisant la cuisine ouest et centrafricaine, coiffeurs à l'aise avec les cheveux crépus et les nattes/perruques, photographes expérimentés sur les peaux noires, DJ multi-styles (afrobeat, coupé-décalé, RnB, gospel).");
  bullets(doc, [
    "Demandez 3 devis comparables par catégorie.",
    "Vérifiez les avis et les portfolios récents.",
    "Lisez le contrat : acompte, annulation, heures supp.",
  ]);

  section(doc, "4. Budget réaliste en Belgique");
  paragraph(doc, "Pour un mariage afro de 100 invités en Belgique, prévoyez entre 18 000 € et 35 000 € selon la région et le standing. Les postes les plus lourds sont la salle, le traiteur et la photo/vidéo (à eux trois ~60% du budget).");
  bullets(doc, [
    "Salle : 15–25% du budget.",
    "Traiteur (boissons incluses) : 30–40%.",
    "Photo & vidéo : 8–12%.",
    "Tenues et beauté : 8–12%.",
    "Déco, fleurs, papeterie : 5–10%.",
    "Animation, DJ, ambiance : 5–8%.",
  ]);

  section(doc, "5. Check-list culturelle & inclusive");
  bullets(doc, [
    "Menu : prévoir un plat végétarien ET un plat afro signature.",
    "Musique : playlist mixte FR/EN + afro/gospel.",
    "Déco : associer wax, dorures, fleurs locales et cierges.",
    "Programme bilingue (FR/NL/EN) pour les invités.",
    "Photographe formé aux carnations foncées (lumière, balance des blancs).",
    "Coiffure & make-up : essai obligatoire avec produits adaptés.",
  ]);

  doc.addPage().rect(0, 0, doc.page.width, doc.page.height).fill(CREAM);
  doc.fillColor(BORDEAUX).font("Helvetica-Bold").fontSize(22).text("Et maintenant ?", 56, 220);
  doc.moveDown(0.8);
  doc.fillColor(WINE_DEEP).font("Helvetica").fontSize(12).text(
    "Retrouvez-nous sur mariage-afro.be pour comparer les prestataires, demander plusieurs devis en 1 clic et accéder à notre quiz « Quel style de mariage est fait pour vous ? ».",
    { width: doc.page.width - 112, align: "justify" },
  );
  doc.moveDown(1.2);
  doc.fillColor(GOLD).font("Helvetica-Oblique").fontSize(11).text("Mariage Afro · Belgique · 2026", 56, doc.page.height - 80);
  doc.end();
}

// ---- Guide Budget Mariage ----
{
  const doc = makeDoc();
  doc.pipe(fs.createWriteStream(path.join(OUT_DIR, "guide-budget-mariage.pdf")));
  cover(doc, "Guide Budget Mariage", "Comprendre, prioriser et négocier votre budget mariage en Belgique.");

  section(doc, "1. Lire votre estimation");
  paragraph(doc, "Votre estimation a été calculée à partir du nombre d'invités, de la région, du standing et du mois de mariage. Elle présente une fourchette min/max par poste, à utiliser comme garde-fou pour vos demandes de devis.");

  section(doc, "2. Postes prioritaires");
  bullets(doc, [
    "Salle : poser la date avant tout autre engagement.",
    "Traiteur : valider menu + boissons (souvent oubliées).",
    "Photo/vidéo : vérifier les retouches et le délai de livraison.",
    "DJ : exiger une playlist test et un plan B sono.",
  ]);

  section(doc, "3. Marge & imprévus");
  paragraph(doc, "Prévoyez 8 à 12% de marge sur le total max pour absorber les imprévus : hausse du nombre d'invités, heures supplémentaires, changement de dernière minute, transport.");

  section(doc, "4. Négocier intelligemment");
  bullets(doc, [
    "Comparez 3 devis détaillés (pas seulement le prix global).",
    "Hors-saison (nov–mars) : -10 à -20% sur la salle.",
    "Pack photo+vidéo : souvent moins cher que séparément.",
    "Demandez la TVA incluse, écrite noir sur blanc.",
  ]);

  section(doc, "5. Ce qu'il ne faut PAS sacrifier");
  bullets(doc, [
    "La photo : ce sont vos seuls souvenirs durables.",
    "Le son : rien ne tue plus une soirée qu'un mauvais DJ.",
    "L'organisation jour J : un wedding planner ou coordinateur évite le chaos.",
  ]);

  doc.addPage().rect(0, 0, doc.page.width, doc.page.height).fill(CREAM);
  doc.fillColor(BORDEAUX).font("Helvetica-Bold").fontSize(22).text("Prochaine étape", 56, 220);
  doc.moveDown(0.8);
  doc.fillColor(WINE_DEEP).font("Helvetica").fontSize(12).text(
    "Demandez plusieurs devis en 1 clic via notre marketplace, ou prenez rendez-vous avec un wedding planner partenaire pour cadrer votre budget.",
    { width: doc.page.width - 112, align: "justify" },
  );
  doc.fillColor(GOLD).font("Helvetica-Oblique").fontSize(11).text("Mariage Afro · mariage-afro.be", 56, doc.page.height - 80);
  doc.end();
}

console.log("PDFs generated in", OUT_DIR);
