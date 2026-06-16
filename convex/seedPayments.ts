import { mutation } from "./_generated/server";

/** Seed default payment gateway options */
export const seedPaymentGateways = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("paymentGateways").first();
    if (existing) return { message: "Already seeded" };

    const now = Date.now();

    await ctx.db.insert("paymentGateways", {
      gateway: "duitku",
      enabled: true,
      displayName: "Duitku",
      sandbox: true,
      merchantCode: "",
      apiKey: "",
      callbackUrl: "",
      updatedAt: now,
    });

    await ctx.db.insert("paymentGateways", {
      gateway: "tripay",
      enabled: true,
      displayName: "Tripay",
      sandbox: true,
      tripayApiKey: "",
      tripayPrivateKey: "",
      tripayMerchantCode: "",
      updatedAt: now,
    });

    await ctx.db.insert("paymentGateways", {
      gateway: "manual_qris",
      enabled: true,
      displayName: "QRIS Manual",
      sandbox: false,
      qrisImageUrl: "",
      qrisAccountName: "AdalahCredit AI",
      qrisInstructions: "1. Scan kode QRIS di atas\n2. Masukkan nominal yang sesuai\n3. Screenshot bukti transfer\n4. Upload bukti di bawah\n5. Tunggu konfirmasi admin (max 1x24 jam)",
      updatedAt: now,
    });

    return { message: "Seeded 3 payment gateways" };
  },
});
