export type Locale = "fr" | "nl" | "en";

export function normalizeLocale(value: string | null | undefined): Locale {
  const v = (value ?? "fr").toLowerCase();
  if (v.startsWith("nl")) return "nl";
  if (v.startsWith("en")) return "en";
  return "fr";
}

interface Dictionary {
  brandTagline: Record<Locale, string>;
  greeting: (name: string) => Record<Locale, string>;
  footer: Record<Locale, string>;
  ctaOpen: Record<Locale, string>;
  signature: Record<Locale, string>;

  adminNewLead: {
    subject: (name: string) => Record<Locale, string>;
    title: Record<Locale, string>;
    intro: Record<Locale, string>;
    rowName: Record<Locale, string>;
    rowEmail: Record<Locale, string>;
    rowPhone: Record<Locale, string>;
    rowDate: Record<Locale, string>;
    rowGuests: Record<Locale, string>;
    rowBudget: Record<Locale, string>;
    rowType: Record<Locale, string>;
    rowServices: Record<Locale, string>;
    rowMessage: Record<Locale, string>;
    rowVendor: Record<Locale, string>;
  };

  vendorNewLead: {
    subject: (vendor: string) => Record<Locale, string>;
    title: Record<Locale, string>;
    intro: (vendor: string) => Record<Locale, string>;
    cta: Record<Locale, string>;
  };

  conversation: {
    subject: (sender: string) => Record<Locale, string>;
    title: Record<Locale, string>;
    intro: (sender: string) => Record<Locale, string>;
    cta: Record<Locale, string>;
  };

  rsvp: {
    subject: (guest: string) => Record<Locale, string>;
    title: Record<Locale, string>;
    intro: (guest: string, attending: boolean, count: number) => Record<Locale, string>;
    rowName: Record<Locale, string>;
    rowEmail: Record<Locale, string>;
    rowGuests: Record<Locale, string>;
    rowAttending: Record<Locale, string>;
    rowMessage: Record<Locale, string>;
    yes: Record<Locale, string>;
    no: Record<Locale, string>;
  };

  vendorApproved: {
    subject: Record<Locale, string>;
    title: Record<Locale, string>;
    intro: (business: string) => Record<Locale, string>;
    body: Record<Locale, string>;
    cta: Record<Locale, string>;
  };

  partnerReceived: {
    subject: Record<Locale, string>;
    title: Record<Locale, string>;
    intro: (name: string) => Record<Locale, string>;
    body: Record<Locale, string>;
  };
}

export const dict: Dictionary = {
  brandTagline: {
    fr: "Plateforme premium pour mariages afro & mixtes en Belgique",
    nl: "Premium platform voor Afrikaanse & gemengde bruiloften in België",
    en: "Premium platform for Afro & mixed weddings in Belgium",
  },
  greeting: (name) => ({
    fr: `Bonjour ${name},`,
    nl: `Hallo ${name},`,
    en: `Hello ${name},`,
  }),
  footer: {
    fr: "Mariage Afro — Bruxelles, Belgique",
    nl: "Mariage Afro — Brussel, België",
    en: "Mariage Afro — Brussels, Belgium",
  },
  ctaOpen: {
    fr: "Ouvrir",
    nl: "Openen",
    en: "Open",
  },
  signature: {
    fr: "L'équipe Mariage Afro",
    nl: "Het Mariage Afro team",
    en: "The Mariage Afro team",
  },

  adminNewLead: {
    subject: (name) => ({
      fr: `[Mariage Afro] Nouveau lead — ${name}`,
      nl: `[Mariage Afro] Nieuwe lead — ${name}`,
      en: `[Mariage Afro] New lead — ${name}`,
    }),
    title: {
      fr: "Nouveau lead reçu",
      nl: "Nieuwe lead ontvangen",
      en: "New lead received",
    },
    intro: {
      fr: "Une nouvelle demande vient d'arriver.",
      nl: "Er is zojuist een nieuwe aanvraag binnengekomen.",
      en: "A new request just came in.",
    },
    rowName: { fr: "Nom", nl: "Naam", en: "Name" },
    rowEmail: { fr: "Email", nl: "E-mail", en: "Email" },
    rowPhone: { fr: "Téléphone", nl: "Telefoon", en: "Phone" },
    rowDate: { fr: "Date du mariage", nl: "Trouwdatum", en: "Wedding date" },
    rowGuests: { fr: "Nombre d'invités", nl: "Aantal gasten", en: "Guest count" },
    rowBudget: { fr: "Budget estimé", nl: "Geschat budget", en: "Estimated budget" },
    rowType: { fr: "Type de mariage", nl: "Type bruiloft", en: "Wedding type" },
    rowServices: { fr: "Services souhaités", nl: "Gewenste diensten", en: "Requested services" },
    rowMessage: { fr: "Message", nl: "Bericht", en: "Message" },
    rowVendor: { fr: "Prestataire ciblé", nl: "Gekozen leverancier", en: "Targeted vendor" },
  },

  vendorNewLead: {
    subject: (vendor) => ({
      fr: `Nouvelle demande pour ${vendor} — Mariage Afro`,
      nl: `Nieuwe aanvraag voor ${vendor} — Mariage Afro`,
      en: `New request for ${vendor} — Mariage Afro`,
    }),
    title: {
      fr: "Vous avez une nouvelle demande",
      nl: "U heeft een nieuwe aanvraag",
      en: "You have a new request",
    },
    intro: (vendor) => ({
      fr: `Un couple vient de vous contacter via votre fiche ${vendor} sur Mariage Afro.`,
      nl: `Een koppel heeft contact opgenomen via uw profiel ${vendor} op Mariage Afro.`,
      en: `A couple just contacted you through your ${vendor} listing on Mariage Afro.`,
    }),
    cta: {
      fr: "Voir dans mon Espace Pro",
      nl: "Bekijken in mijn Pro-ruimte",
      en: "View in my Pro Space",
    },
  },

  conversation: {
    subject: (sender) => ({
      fr: `Nouveau message de ${sender} — Mariage Afro`,
      nl: `Nieuw bericht van ${sender} — Mariage Afro`,
      en: `New message from ${sender} — Mariage Afro`,
    }),
    title: {
      fr: "Vous avez un nouveau message",
      nl: "U heeft een nieuw bericht",
      en: "You have a new message",
    },
    intro: (sender) => ({
      fr: `${sender} vient de vous écrire sur Mariage Afro.`,
      nl: `${sender} heeft u zojuist een bericht gestuurd op Mariage Afro.`,
      en: `${sender} just sent you a message on Mariage Afro.`,
    }),
    cta: {
      fr: "Lire le message",
      nl: "Bericht lezen",
      en: "Read message",
    },
  },

  rsvp: {
    subject: (guest) => ({
      fr: `Nouvelle réponse de ${guest} à votre invitation — Mariage Afro`,
      nl: `Nieuw antwoord van ${guest} op uw uitnodiging — Mariage Afro`,
      en: `New RSVP from ${guest} to your invitation — Mariage Afro`,
    }),
    title: {
      fr: "Nouvelle réponse RSVP",
      nl: "Nieuw RSVP antwoord",
      en: "New RSVP response",
    },
    intro: (guest, attending, count) => ({
      fr: attending
        ? `${guest} a confirmé sa présence (${count} personne${count > 1 ? "s" : ""}).`
        : `${guest} ne pourra malheureusement pas être présent.`,
      nl: attending
        ? `${guest} heeft de aanwezigheid bevestigd (${count} persoon${count > 1 ? "en" : ""}).`
        : `${guest} kan helaas niet aanwezig zijn.`,
      en: attending
        ? `${guest} has confirmed attendance (${count} guest${count > 1 ? "s" : ""}).`
        : `${guest} unfortunately can't attend.`,
    }),
    rowName: { fr: "Nom", nl: "Naam", en: "Name" },
    rowEmail: { fr: "Email", nl: "E-mail", en: "Email" },
    rowGuests: { fr: "Nombre de personnes", nl: "Aantal personen", en: "Number of guests" },
    rowAttending: { fr: "Présence", nl: "Aanwezigheid", en: "Attending" },
    rowMessage: { fr: "Message", nl: "Bericht", en: "Message" },
    yes: { fr: "Oui", nl: "Ja", en: "Yes" },
    no: { fr: "Non", nl: "Nee", en: "No" },
  },

  vendorApproved: {
    subject: {
      fr: "Bienvenue sur Mariage Afro — votre fiche est en ligne",
      nl: "Welkom bij Mariage Afro — uw profiel is online",
      en: "Welcome to Mariage Afro — your listing is live",
    },
    title: {
      fr: "Votre candidature est approuvée",
      nl: "Uw aanvraag is goedgekeurd",
      en: "Your application is approved",
    },
    intro: (business) => ({
      fr: `Félicitations ! La fiche ${business} est désormais publiée dans la marketplace Mariage Afro.`,
      nl: `Gefeliciteerd! Het profiel ${business} is nu gepubliceerd op de Mariage Afro marketplace.`,
      en: `Congratulations! The listing ${business} is now live on the Mariage Afro marketplace.`,
    }),
    body: {
      fr: "Connectez-vous à votre Espace Pro pour compléter votre galerie, vos services et répondre aux demandes des couples.",
      nl: "Log in op uw Pro-ruimte om uw galerij, diensten te vervolledigen en aanvragen van koppels te beantwoorden.",
      en: "Log in to your Pro Space to complete your gallery, services and reply to couples' requests.",
    },
    cta: {
      fr: "Accéder à mon Espace Pro",
      nl: "Naar mijn Pro-ruimte",
      en: "Go to my Pro Space",
    },
  },

  partnerReceived: {
    subject: {
      fr: "Votre candidature partenaire a bien été reçue — Mariage Afro",
      nl: "Uw partneraanvraag is goed ontvangen — Mariage Afro",
      en: "Your partner application has been received — Mariage Afro",
    },
    title: {
      fr: "Merci pour votre candidature",
      nl: "Bedankt voor uw aanvraag",
      en: "Thank you for your application",
    },
    intro: (name) => ({
      fr: `Bonjour ${name}, nous avons bien reçu votre candidature partenaire.`,
      nl: `Hallo ${name}, wij hebben uw partneraanvraag goed ontvangen.`,
      en: `Hello ${name}, we have received your partner application.`,
    }),
    body: {
      fr: "Notre équipe étudie votre dossier et reviendra vers vous dans les plus brefs délais. À très vite.",
      nl: "Ons team bestudeert uw dossier en neemt zo spoedig mogelijk contact met u op. Tot snel.",
      en: "Our team is reviewing your application and will get back to you shortly. Talk soon.",
    },
  },
};

export function t<K extends keyof Dictionary>(key: K, locale: Locale): Dictionary[K] {
  return dict[key];
}

export function pick<T extends Record<Locale, string>>(map: T, locale: Locale): string {
  return map[locale] ?? map.fr;
}
