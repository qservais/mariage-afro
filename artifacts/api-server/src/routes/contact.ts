import { Router } from "express";
import { Resend } from "resend";

const router = Router();

router.post("/contact", async (req, res) => {
  const { name, email, phone, date, type, message } = req.body;

  if (!name || !email || !message) {
    res.status(400).json({ error: "Champs requis manquants" });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    req.log.warn("RESEND_API_KEY is not configured — contact form submission skipped");
    res.json({ success: true, note: "Email not sent (no API key configured)" });
    return;
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: "Mariage Afro <noreply@mariage-afro.com>",
    to: "info@mariage-afro.com",
    subject: `Nouvelle demande de RDV — ${name}`,
    html: `
      <h2>Nouvelle demande de rendez-vous</h2>
      <p><strong>Nom :</strong> ${name}</p>
      <p><strong>Email :</strong> ${email}</p>
      <p><strong>Téléphone :</strong> ${phone || "Non renseigné"}</p>
      <p><strong>Date envisagée :</strong> ${date || "Non renseignée"}</p>
      <p><strong>Type de mariage :</strong> ${type || "Non renseigné"}</p>
      <p><strong>Message :</strong></p>
      <p>${message}</p>
    `,
  });

  if (error) {
    req.log.error({ error }, "Failed to send contact email");
    res.status(500).json({ error: "Erreur lors de l'envoi de l'email." });
    return;
  }

  res.json({ success: true });
});

export default router;
