import { Router } from "express";
import { Resend } from "resend";

const router = Router();

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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

  const safeName = escapeHtml(String(name));
  const safeEmail = escapeHtml(String(email));
  const safePhone = escapeHtml(String(phone || "Non renseigné"));
  const safeDate = escapeHtml(String(date || "Non renseignée"));
  const safeType = escapeHtml(String(type || "Non renseigné"));
  const safeMessage = escapeHtml(String(message));

  const { error } = await resend.emails.send({
    from: "Mariage Afro <noreply@mariage-afro.com>",
    to: "info@mariage-afro.com",
    subject: `Nouvelle demande de RDV — ${safeName}`,
    html: `
      <h2>Nouvelle demande de rendez-vous</h2>
      <p><strong>Nom :</strong> ${safeName}</p>
      <p><strong>Email :</strong> ${safeEmail}</p>
      <p><strong>Téléphone :</strong> ${safePhone}</p>
      <p><strong>Date envisagée :</strong> ${safeDate}</p>
      <p><strong>Type de mariage :</strong> ${safeType}</p>
      <p><strong>Message :</strong></p>
      <p style="white-space: pre-wrap;">${safeMessage}</p>
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
