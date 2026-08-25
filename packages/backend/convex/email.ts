"use node";

import { v } from "convex/values";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { internalAction } from "./_generated/server";

/**
 * Universal email sender action.
 * Uses Resend API when RESEND_API_KEY or AUTH_RESEND_KEY is configured.
 * Falls back to SMTP when SMTP_HOST is present, or console logging in dev mode.
 */
export const sendEmail = internalAction({
  args: { to: v.string(), subject: v.string(), text: v.string() },
  handler: async (_ctx, { to, subject, text }) => {
    const resendApiKey = process.env.AUTH_RESEND_KEY || process.env.RESEND_API_KEY;
    const fromAddress = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

    // 1. Resend API delivery
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const { data, error } = await resend.emails.send({
          from: fromAddress,
          to,
          subject,
          text,
        });

        if (error) {
          console.error(`[Resend] Delivery failed to ${to}:`, error);
          throw new Error(`Resend error: ${error.message}`);
        }

        console.log(`[Resend] Email successfully sent to ${to} (id: ${data?.id})`);
        return;
      } catch (err) {
        console.error(`[Resend] Unexpected error sending email:`, err);
        throw err;
      }
    }

    // 2. SMTP fallback
    const host = process.env.SMTP_HOST;
    if (host) {
      const transport = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT ?? "1025"),
        secure: false,
        ...(process.env.SMTP_USER
          ? {
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS ?? "",
              },
            }
          : {}),
      });
      await transport.sendMail({
        from: process.env.SMTP_FROM ?? "auth@myos.local",
        to,
        subject,
        text,
      });
      console.log(`[SMTP] Email sent to ${to}`);
      return;
    }

    console.warn(`[email] No email provider configured. Simulating delivery to ${to}: "${subject}"`);
  },
});
