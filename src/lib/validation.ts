import { z } from "zod";
import { BACKUP_FREQUENCIES, PAYMENT_METHODS, ROLES, TABLE_SHAPES } from "./constants";
import { isValidTimezone } from "./time";

const name = z.string().trim().min(1).max(100);
const money = z.number().int().min(0).max(100_000_000); // minor units

export const loginSchema = z.object({
  email: z.email("Enter a valid email."),
  password: z.string().min(1, "Enter your password.").max(200),
  outletId: z.string().max(64).optional(), // owner may pick an outlet at login
});

export const pinSwitchSchema = z.object({
  userId: z.string().min(1).max(64),
  pin: z.string().regex(/^\d{4}$/, "PIN is 4 digits."),
});

export const seatTableSchema = z.object({
  tableId: z.string().min(1).max(64),
  customerName: z.string().trim().max(100).optional(),
  guestCount: z.number().int().min(1).max(200).optional(),
});

export const addItemSchema = z.object({
  menuItemId: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(99),
  notes: z.string().trim().max(200).optional(),
  // Ids only — prices are read from the item's own allow-list server-side.
  modifierIds: z.array(z.string().min(1).max(64)).max(20).optional(),
});

export const updateItemSchema = z
  .object({
    quantity: z.number().int().min(1).max(99).optional(),
    notes: z.string().trim().max(200).optional(),
  })
  .refine((v) => v.quantity !== undefined || v.notes !== undefined, "Nothing to change.");

export const settleSchema = z.object({
  method: z.enum(PAYMENT_METHODS),
});

export const categorySchema = z.object({
  name,
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

export const categoryPatchSchema = z.object({
  name: name.optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  published: z.boolean().optional(),
});

export const menuItemSchema = z.object({
  categoryId: z.string().min(1).max(64),
  name,
  description: z.string().trim().max(500).optional(),
  priceCents: money,
  available: z.boolean().optional(),
  published: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

export const menuItemPatchSchema = menuItemSchema.partial().omit({ categoryId: true });

export const reportQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  groupBy: z.enum(["day", "month"]).default("day"),
});

export const outletSchema = z.object({
  name,
  address: z.string().trim().max(300).optional(),
  phone: z.string().trim().max(30).optional(),
  currency: z.string().trim().length(3).toUpperCase().optional(),
  timezone: z
    .string()
    .trim()
    .max(64)
    .refine(isValidTimezone, "That isn't an IANA timezone, e.g. UTC or Asia/Kathmandu.")
    .optional(),
});

export const outletPatchSchema = outletSchema.partial().extend({
  active: z.boolean().optional(),
});

export const userCreateSchema = z
  .object({
    name,
    role: z.enum(ROLES),
    outletId: z.string().max(64).optional(), // required for staff/manager, applied server-side
    email: z.email("Enter a valid email.").optional(),
    password: z.string().min(8, "Password must be at least 8 characters.").max(200).optional(),
    pin: z.string().regex(/^\d{4}$/, "PIN is 4 digits.").optional(),
  })
  .refine((v) => v.role === "staff" || (v.email && v.password), {
    message: "Managers and owners need an email and a password.",
  })
  .refine((v) => v.role !== "staff" || v.pin, { message: "Staff need a PIN." });

export const userPatchSchema = z.object({
  name: name.optional(),
  active: z.boolean().optional(),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200).optional(),
  pin: z.string().regex(/^\d{4}$/, "PIN is 4 digits.").optional(),
  outletId: z.string().max(64).optional(),
});

const hhmm = z.string().regex(/^\d{2}:\d{2}$/, "Give times as HH:MM.");
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Give the date as YYYY-MM-DD.");

export const tableSchema = z.object({
  name,
  capacity: z.number().int().min(1, "A table seats at least one.").max(50),
  zone: z.string().trim().max(60).optional(),
  shape: z.enum(TABLE_SHAPES).optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

export const modifierSchema = z.object({
  name,
  priceCents: money,
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

export const modifierPatchSchema = modifierSchema.partial().extend({
  active: z.boolean().optional(),
});

export const itemModifiersSchema = z.object({
  modifierIds: z.array(z.string().min(1).max(64)).max(50),
});

export const tablePatchSchema = tableSchema.partial().extend({
  active: z.boolean().optional(),
});

// A service period OR all day, never neither: the refine is what stops a
// booking with no window at all reaching the domain layer. Clock times are
// deliberately not accepted — a host picks Lunch or Dinner, not 19:15.
export const reservationSchema = z
  .object({
    tableId: z.string().min(1).max(64),
    customerName: name,
    phone: z.string().trim().max(30).optional(),
    email: z.email("Enter a valid email.").optional().or(z.literal("")),
    partySize: z.number().int().min(1, "At least one guest.").max(200),
    needsConfirmation: z.boolean().optional(),
    date: ymd,
    servicePeriodId: z.string().min(1).max(64).optional(),
    allDay: z.boolean().optional(),
    notes: z.string().trim().max(300).optional(),
  })
  .refine((v) => v.allDay === true || Boolean(v.servicePeriodId), {
    message: "Pick a service period, or hold the table all day.",
  });

export const reservationPatchSchema = z
  .object({
    tableId: z.string().min(1).max(64).optional(),
    customerName: name.optional(),
    phone: z.string().trim().max(30).optional(),
    email: z.email("Enter a valid email.").optional().or(z.literal("")),
    partySize: z.number().int().min(1).max(200).optional(),
    date: ymd.optional(),
    servicePeriodId: z.string().min(1).max(64).optional(),
    allDay: z.boolean().optional(),
    notes: z.string().trim().max(300).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Nothing to change.");

export const servicePeriodSchema = z.object({
  name,
  startTime: hhmm,
  endTime: hhmm,
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

export const servicePeriodPatchSchema = servicePeriodSchema.partial().extend({
  active: z.boolean().optional(),
});

export const reservationQuerySchema = z.object({
  date: ymd.optional(),
});

export const backupSettingsSchema = z.object({
  backupFrequency: z.enum(BACKUP_FREQUENCIES).optional(),
  backupRetention: z.number().int().min(1).max(365).optional(),
});

export const restoreSchema = z.object({
  filename: z.string().regex(/^[\w-]+\.json$/),
});
