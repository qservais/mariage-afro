import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, vendorQuotesTable, vendorAccountsTable } from "@workspace/db";

const router = Router();

router.get("/quotes/view/:token", async (req, res) => {
  const { token } = req.params;
  if (!token || token.length < 8) { res.status(400).json({ error: "Invalid token" }); return; }
  const [quote] = await db.select().from(vendorQuotesTable).where(eq(vendorQuotesTable.viewToken, token)).limit(1);
  if (!quote) { res.status(404).json({ error: "Quote not found" }); return; }
  if (quote.status === "draft") { res.status(403).json({ error: "Quote not yet sent" }); return; }
  const [account] = await db.select({
    businessName: vendorAccountsTable.businessName,
    email: vendorAccountsTable.email,
    phone: vendorAccountsTable.phone,
  }).from(vendorAccountsTable).where(eq(vendorAccountsTable.id, quote.vendorAccountId)).limit(1);
  res.json({ quote, vendor: account ?? null });
});

export default router;
