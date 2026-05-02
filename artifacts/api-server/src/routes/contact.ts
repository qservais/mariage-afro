import { Router } from "express";
import { sendContactFormEmail } from "../lib/email";

const router = Router();

router.post("/contact", (req, res) => {
  const { name, email, phone, date, type, message } = req.body ?? {};
  if (!name || !email || !message) {
    res.status(400).json({ error: "Champs requis manquants" });
    return;
  }

  // Fire-and-forget — never block the HTTP response on Resend latency/failures
  void sendContactFormEmail(
    {
      name: String(name),
      email: String(email),
      phone: phone ? String(phone) : null,
      date: date ? String(date) : null,
      type: type ? String(type) : null,
      message: String(message),
    },
    req.log,
  ).catch((err) => req.log.error({ err }, "Failed to send contact email"));

  res.json({ success: true });
});

export default router;
