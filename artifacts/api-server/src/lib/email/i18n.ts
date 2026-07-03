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
  footerBy: Record<Locale, string>;
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

  budgetResult: {
    subject: Record<Locale, string>;
    title: Record<Locale, string>;
    intro: (name: string) => Record<Locale, string>;
    body: Record<Locale, string>;
    cta: Record<Locale, string>;
  };

  quizResult: {
    subject: (profile: string) => Record<Locale, string>;
    title: Record<Locale, string>;
    intro: (name: string, profile: string) => Record<Locale, string>;
    body: Record<Locale, string>;
    cta: Record<Locale, string>;
  };

  leadMagnet: {
    subject: Record<Locale, string>;
    title: Record<Locale, string>;
    intro: (name: string) => Record<Locale, string>;
    body: Record<Locale, string>;
    cta: Record<Locale, string>;
  };

  multiDevis: {
    subject: Record<Locale, string>;
    title: Record<Locale, string>;
    intro: (name: string, count: number) => Record<Locale, string>;
    body: Record<Locale, string>;
    rowVendors: Record<Locale, string>;
  };

  authEmail: {
    verify: {
      subject: Record<Locale, string>;
      title: Record<Locale, string>;
      intro: Record<Locale, string>;
      ctaLabel: Record<Locale, string>;
    };
    reset: {
      subject: Record<Locale, string>;
      title: Record<Locale, string>;
      intro: Record<Locale, string>;
      ctaLabel: Record<Locale, string>;
    };
  };

  vendorSubscription: {
    active: {
      subject: (tier: string) => Record<Locale, string>;
      title: Record<Locale, string>;
      intro: (name: string, tier: string) => Record<Locale, string>;
    };
    cancelled: {
      subject: (tier: string) => Record<Locale, string>;
      title: Record<Locale, string>;
      intro: (name: string, tier: string) => Record<Locale, string>;
    };
    expired: {
      subject: (tier: string) => Record<Locale, string>;
      title: Record<Locale, string>;
      intro: (name: string, tier: string) => Record<Locale, string>;
    };
    rowTier: Record<Locale, string>;
    rowStatus: Record<Locale, string>;
    rowExpiry: Record<Locale, string>;
    cta: Record<Locale, string>;
  };

  vendorLeadFollowup: {
    subject: (count: number) => Record<Locale, string>;
    title: Record<Locale, string>;
    intro: (name: string) => Record<Locale, string>;
    rowNew: Record<Locale, string>;
    rowContacted: Record<Locale, string>;
    cta: Record<Locale, string>;
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
    fr: "MARIAGE AFRO | La plateforme dédiée aux mariages afro et mixtes",
    nl: "MARIAGE AFRO | Het platform voor Afrikaanse & gemengde bruiloften",
    en: "MARIAGE AFRO | The platform dedicated to Afro & mixed weddings",
  },
  footerBy: {
    fr: "Par : MARIAGE AFRO — La plateforme dédiée aux mariages afro et mixtes",
    nl: "Door: MARIAGE AFRO — Het platform voor Afrikaanse & gemengde bruiloften",
    en: "By: MARIAGE AFRO — The platform dedicated to Afro & mixed weddings",
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
      fr: `Mariage Afro — Nouveau lead — ${name}`,
      nl: `Mariage Afro — Nieuwe lead — ${name}`,
      en: `Mariage Afro — New lead — ${name}`,
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

  budgetResult: {
    subject: {
      fr: "Votre estimation de budget mariage — Mariage Afro",
      nl: "Uw budgetschatting voor de bruiloft — Mariage Afro",
      en: "Your wedding budget estimate — Mariage Afro",
    },
    title: {
      fr: "Votre estimation de budget",
      nl: "Uw budgetschatting",
      en: "Your budget estimate",
    },
    intro: (name) => ({
      fr: `Bonjour ${name}, voici l'estimation détaillée de votre budget mariage.`,
      nl: `Hallo ${name}, hier is de gedetailleerde schatting van uw bruiloftsbudget.`,
      en: `Hello ${name}, here is the detailed estimate of your wedding budget.`,
    }),
    body: {
      fr: "Cette estimation est indicative — chaque mariage est unique. Pour un budget personnalisé, échangez avec notre équipe.",
      nl: "Deze schatting is indicatief — elke bruiloft is uniek. Neem contact op met ons team voor een persoonlijk budget.",
      en: "This is an indicative estimate — every wedding is unique. Contact our team for a personalised budget.",
    },
    cta: {
      fr: "Télécharger le guide budget (PDF)",
      nl: "Download de budgetgids (PDF)",
      en: "Download the budget guide (PDF)",
    },
  },

  quizResult: {
    subject: (profile) => ({
      fr: `Votre profil de mariage : ${profile} — Mariage Afro`,
      nl: `Uw bruiloftsprofiel: ${profile} — Mariage Afro`,
      en: `Your wedding profile: ${profile} — Mariage Afro`,
    }),
    title: {
      fr: "Votre profil de mariage",
      nl: "Uw bruiloftsprofiel",
      en: "Your wedding profile",
    },
    intro: (name, profile) => ({
      fr: `Bonjour ${name}, votre profil de mariage est : ${profile}.`,
      nl: `Hallo ${name}, uw bruiloftsprofiel is: ${profile}.`,
      en: `Hello ${name}, your wedding profile is: ${profile}.`,
    }),
    body: {
      fr: "Découvrez les prestataires recommandés pour votre profil sur notre plateforme.",
      nl: "Ontdek de aanbevolen leveranciers voor uw profiel op ons platform.",
      en: "Discover the recommended vendors for your profile on our platform.",
    },
    cta: {
      fr: "Voir mes prestataires recommandés",
      nl: "Mijn aanbevolen leveranciers bekijken",
      en: "See my recommended vendors",
    },
  },

  leadMagnet: {
    subject: {
      fr: "Mon mariage afro en 12 étapes — votre guide gratuit",
      nl: "Mijn Afrikaanse bruiloft in 12 stappen — uw gratis gids",
      en: "My Afro wedding in 12 steps — your free guide",
    },
    title: {
      fr: "Votre guide gratuit",
      nl: "Uw gratis gids",
      en: "Your free guide",
    },
    intro: (name) => ({
      fr: `Bonjour ${name}, voici votre guide "Mon mariage afro en 12 étapes".`,
      nl: `Hallo ${name}, hier is uw gids "Mijn Afrikaanse bruiloft in 12 stappen".`,
      en: `Hello ${name}, here is your guide "My Afro wedding in 12 steps".`,
    }),
    body: {
      fr: "Téléchargez le guide ci-dessous et n'hésitez pas à nous écrire pour toute question.",
      nl: "Download de gids hieronder en aarzel niet om ons te schrijven met vragen.",
      en: "Download the guide below and feel free to write to us with any questions.",
    },
    cta: {
      fr: "Télécharger le guide",
      nl: "Gids downloaden",
      en: "Download the guide",
    },
  },

  multiDevis: {
    subject: {
      fr: "Vos demandes de devis ont été envoyées — Mariage Afro",
      nl: "Uw offerteaanvragen zijn verzonden — Mariage Afro",
      en: "Your quote requests have been sent — Mariage Afro",
    },
    title: {
      fr: "Vos demandes ont été envoyées",
      nl: "Uw aanvragen zijn verzonden",
      en: "Your requests have been sent",
    },
    intro: (name, count) => ({
      fr: `Bonjour ${name}, nous avons envoyé votre demande à ${count} prestataire${count > 1 ? "s" : ""}.`,
      nl: `Hallo ${name}, wij hebben uw aanvraag naar ${count} leverancier${count > 1 ? "s" : ""} gestuurd.`,
      en: `Hello ${name}, we sent your request to ${count} vendor${count > 1 ? "s" : ""}.`,
    }),
    body: {
      fr: "Chaque prestataire reviendra vers vous individuellement. Vous pouvez suivre vos échanges depuis votre boîte mail.",
      nl: "Elke leverancier neemt individueel contact met u op. U kunt uw uitwisselingen volgen via uw inbox.",
      en: "Each vendor will reply to you individually. Track your conversations from your inbox.",
    },
    rowVendors: {
      fr: "Prestataires contactés",
      nl: "Gecontacteerde leveranciers",
      en: "Vendors contacted",
    },
  },

  authEmail: {
    verify: {
      subject: {
        fr: "Vérifiez votre adresse email — Mariage Afro",
        nl: "Verifieer uw e-mailadres — Mariage Afro",
        en: "Verify your email address — Mariage Afro",
      },
      title: {
        fr: "Confirmez votre email",
        nl: "Bevestig uw e-mailadres",
        en: "Confirm your email address",
      },
      intro: {
        fr: "Merci de vous être inscrit(e) sur Mariage Afro. Cliquez sur le bouton ci-dessous pour vérifier votre adresse email. Ce lien expire dans 24 heures.",
        nl: "Bedankt voor uw registratie bij Mariage Afro. Klik op de onderstaande knop om uw e-mailadres te verifiëren. Deze link verloopt na 24 uur.",
        en: "Thank you for registering on Mariage Afro. Click the button below to verify your email address. This link expires in 24 hours.",
      },
      ctaLabel: {
        fr: "Vérifier mon email",
        nl: "Mijn e-mailadres bevestigen",
        en: "Verify my email",
      },
    },
    reset: {
      subject: {
        fr: "Réinitialisation de votre mot de passe — Mariage Afro",
        nl: "Wachtwoord opnieuw instellen — Mariage Afro",
        en: "Reset your password — Mariage Afro",
      },
      title: {
        fr: "Réinitialisez votre mot de passe",
        nl: "Wachtwoord opnieuw instellen",
        en: "Reset your password",
      },
      intro: {
        fr: "Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien expire dans 1 heure.",
        nl: "U heeft verzocht uw wachtwoord opnieuw in te stellen. Klik op de onderstaande knop om een nieuw wachtwoord te kiezen. Deze link verloopt na 1 uur.",
        en: "You requested a password reset. Click the button below to choose a new password. This link expires in 1 hour.",
      },
      ctaLabel: {
        fr: "Réinitialiser mon mot de passe",
        nl: "Mijn wachtwoord opnieuw instellen",
        en: "Reset my password",
      },
    },
  },

  vendorSubscription: {
    active: {
      subject: (tier) => ({
        fr: `Votre formule ${tier} est active — Mariage Afro`,
        nl: `Uw formule ${tier} is actief — Mariage Afro`,
        en: `Your ${tier} plan is now active — Mariage Afro`,
      }),
      title: { fr: "Formule activée", nl: "Formule geactiveerd", en: "Plan activated" },
      intro: (name, tier) => ({
        fr: `Bonne nouvelle ${name} ! Votre formule ${tier} est maintenant active sur la marketplace.`,
        nl: `Goed nieuws ${name}! Uw formule ${tier} is nu actief op de marketplace.`,
        en: `Great news ${name}! Your ${tier} plan is now active on the marketplace.`,
      }),
    },
    cancelled: {
      subject: (tier) => ({
        fr: `Votre abonnement ${tier} a été annulé — Mariage Afro`,
        nl: `Uw abonnement ${tier} is opgezegd — Mariage Afro`,
        en: `Your ${tier} subscription has been cancelled — Mariage Afro`,
      }),
      title: { fr: "Abonnement annulé", nl: "Abonnement opgezegd", en: "Subscription cancelled" },
      intro: (name, tier) => ({
        fr: `${name}, votre abonnement ${tier} a été annulé.`,
        nl: `${name}, uw abonnement ${tier} is opgezegd.`,
        en: `${name}, your ${tier} subscription has been cancelled.`,
      }),
    },
    expired: {
      subject: (tier) => ({
        fr: `Votre abonnement ${tier} a expiré — Mariage Afro`,
        nl: `Uw abonnement ${tier} is verlopen — Mariage Afro`,
        en: `Your ${tier} subscription has expired — Mariage Afro`,
      }),
      title: { fr: "Mise à jour de votre abonnement", nl: "Update van uw abonnement", en: "Subscription update" },
      intro: (name, tier) => ({
        fr: `${name}, votre abonnement ${tier} a expiré.`,
        nl: `${name}, uw abonnement ${tier} is verlopen.`,
        en: `${name}, your ${tier} subscription has expired.`,
      }),
    },
    rowTier: { fr: "Formule", nl: "Formule", en: "Plan" },
    rowStatus: { fr: "Statut", nl: "Status", en: "Status" },
    rowExpiry: { fr: "Échéance", nl: "Vervaldatum", en: "Expires" },
    cta: { fr: "Ouvrir mon Espace Pro", nl: "Mijn Pro-ruimte openen", en: "Open my Pro Space" },
  },

  vendorLeadFollowup: {
    subject: (count) => ({
      fr: `Rappel : ${count} demande${count > 1 ? "s" : ""} en attente — Mariage Afro`,
      nl: `Herinnering: ${count} verzoek${count > 1 ? "en" : ""} in behandeling — Mariage Afro`,
      en: `Reminder: ${count} pending request${count > 1 ? "s" : ""} — Mariage Afro`,
    }),
    title: { fr: "Demandes en attente", nl: "Openstaande verzoeken", en: "Pending requests" },
    intro: (name) => ({
      fr: `Bonjour ${name}, vous avez encore des demandes sans réponse depuis plusieurs jours. Une réponse rapide augmente nettement vos chances de conversion.`,
      nl: `Hallo ${name}, u heeft nog openstaande verzoeken zonder antwoord van de afgelopen dagen. Een snelle reactie vergroot uw kansen op conversie aanzienlijk.`,
      en: `Hello ${name}, you still have unanswered requests from the past few days. A quick response significantly increases your conversion chances.`,
    }),
    rowNew: { fr: "Nouvelles non vues", nl: "Nieuwe niet-gezien", en: "New unseen" },
    rowContacted: { fr: "Contactées sans relance", nl: "Gecontacteerd zonder follow-up", en: "Contacted without follow-up" },
    cta: { fr: "Voir mes demandes", nl: "Mijn verzoeken bekijken", en: "View my requests" },
  },
};

export function t<K extends keyof Dictionary>(key: K, locale: Locale): Dictionary[K] {
  return dict[key];
}

export function pick<T extends Record<Locale, string>>(map: T, locale: Locale): string {
  return map[locale] ?? map.fr;
}
