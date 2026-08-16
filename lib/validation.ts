import { z } from 'zod';

// Every public-facing and admin write path is validated server-side with
// these schemas -- the client-side form checks are UX sugar only, never
// trusted on their own.

export const quoteSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(80, 'Name is too long'),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,20}$/, 'Enter a valid phone number'),
  serviceKey: z.string().trim().max(60).optional().nullable(),
  message: z.string().trim().max(500).optional().nullable(),
});
export type QuoteInput = z.infer<typeof quoteSchema>;

export const loginSchema = z.object({
  username: z.string().trim().min(1).max(60),
  password: z.string().min(1).max(200),
});

export const changePasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters').max(200),
});

export const serviceSchema = z.object({
  key: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, 'lowercase letters, numbers, hyphens only')
    .max(40),
  title: z.string().trim().min(1).max(80),
  tagline: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(1000),
  imageUrl: z.string().trim().url('Must be a valid URL'),
  duration: z.string().trim().min(1).max(40),
  warranty: z.string().trim().min(1).max(40),
  process: z.array(z.string().trim().min(1).max(160)).min(1).max(10),
  benefits: z.array(z.string().trim().min(1).max(60)).min(1).max(10),
  sortOrder: z.number().int().min(0).max(1000).optional(),
  isActive: z.boolean().optional(),
});

export const servicePatchSchema = serviceSchema.partial();

export const galleryItemSchema = z.object({
  imageUrl: z.string().trim().url('Must be a valid URL'),
  caption: z.string().trim().min(1).max(120),
  wide: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
  isActive: z.boolean().optional(),
});

export const galleryItemPatchSchema = galleryItemSchema.partial();

export const leadPatchSchema = z.object({
  status: z.enum(['new', 'contacted', 'booked', 'completed', 'lost']).optional(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const settingSchema = z.object({
  key: z.string().trim().min(1).max(80),
  value: z.string().trim().max(500),
});

// Future integration: payload contract for the fixed-camera plate-recognition
// webhook. Not wired to any hardware yet -- see lib/whatsapp.ts-style note in
// app/api/integrations/plate-recognition/route.ts for the rollout plan.
export const plateSightingSchema = z.object({
  cameraId: z.string().trim().min(1).max(60),
  plateNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-\s]{2,20}$/, 'Unexpected plate format'),
  confidence: z.number().min(0).max(1).optional(),
  imageUrl: z.string().trim().url().optional(),
  capturedAt: z.string().datetime().optional(),
});

// ---------------- Shop-floor operations ----------------

export const jobIntakeSchema = z.object({
  customerName: z.string().trim().min(1, 'Customer name is required').max(120),
  phone: z.string().trim().max(20).optional(),
  carModel: z.string().trim().max(120).optional().nullable(),
  customerPlate: z.string().trim().max(20).optional().nullable(),
  services: z.array(z.string().trim().min(1)).min(1, 'Select at least one service'),
  price: z.number().int().min(0).max(10_000_000).optional().nullable(),
});

export const jobPatchSchema = z.object({
  confirmedPlate: z.string().trim().max(20).optional().nullable(),
  services: z.array(z.string().trim().min(1)).min(1).optional(),
  price: z.number().int().min(0).max(10_000_000).optional().nullable(),
  status: z.enum(['draft', 'active', 'completed', 'delivered']).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/)
    .optional(),
});

export const stockItemCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(60),
  qty: z.number().int().min(0).max(1_000_000),
  unit: z.string().trim().min(1).max(30),
  lowAt: z.number().int().min(0).max(1_000_000).optional(),
});

export const stockAdjustSchema = z.object({
  delta: z.number().int().min(-1_000_000).max(1_000_000),
});

export const stockPurchaseSchema = z.object({
  itemName: z.string().trim().min(1).max(120),
  qty: z.number().int().min(1).max(1_000_000),
  unitCost: z.number().int().min(0).max(10_000_000),
});

export const reminderCreateSchema = z.object({
  text: z.string().trim().min(1).max(200),
  dueDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
});

export const reminderPatchSchema = z.object({
  done: z.boolean(),
});

export const pnlPeriodSchema = z.enum(['today', 'week', 'month', 'all']);
