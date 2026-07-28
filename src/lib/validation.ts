import { z } from "zod";
import { isCanonicalDate } from "./availability";

export const availabilityQuerySchema = z.object({
  date: z.string().refine(isCanonicalDate, "Use a real date in YYYY-MM-DD format."),
  partySize: z.coerce.number().int().min(1).max(50),
});

export const createReservationSchema = z.object({
  startsAt: z.iso.datetime().transform((s) => new Date(s)),
  partySize: z.number().int().min(1).max(50),
  guestName: z.string().trim().min(1, "Enter your name.").max(100),
  guestEmail: z.email("Enter a valid email address.").max(200),
  guestPhone: z
    .string()
    .trim()
    .min(5, "Enter a valid phone number.")
    .max(20)
    .regex(/^[+\d][\d\s\-()]*$/, "Enter a valid phone number."),
  notes: z.string().trim().max(500).optional().default(""),
});
