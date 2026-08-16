import { query, queryOne } from './db';
import type {
  Service,
  GalleryItem,
  Lead,
  LeadStatus,
  AdminUser,
  AdminRole,
  VehicleSighting,
  Job,
  JobStatus,
  StockItem,
  StockPurchase,
  Reminder,
  PnlSummary,
} from './types';

// Thin, explicit data-access layer over Postgres. Every query below is
// parameterized ($1, $2, ...) -- user input is never concatenated into SQL
// text, which is the main defense against SQL injection here. Row-mapper
// functions translate snake_case columns to the camelCase shapes the rest
// of the app (API routes, seed script, components) already expects.

const now = () => new Date().toISOString();
const iso = (v: unknown): string => (v instanceof Date ? v.toISOString() : (v as string));

// ---------------- Row mappers ----------------

function mapService(row: any): Service {
  return {
    id: row.id,
    key: row.key,
    title: row.title,
    tagline: row.tagline,
    description: row.description,
    imageUrl: row.image_url,
    duration: row.duration,
    warranty: row.warranty,
    process: row.process ?? [],
    benefits: row.benefits ?? [],
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function mapGalleryItem(row: any): GalleryItem {
  return {
    id: row.id,
    imageUrl: row.image_url,
    caption: row.caption,
    wide: row.wide,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: iso(row.created_at),
  };
}

function mapLead(row: any): Lead {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    serviceKey: row.service_key,
    message: row.message,
    source: row.source,
    status: row.status,
    notes: row.notes,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function mapAdmin(row: any): AdminUser {
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    authProvider: (row.auth_provider as AdminUser['authProvider']) || 'password',
    role: (row.role as AdminRole) || 'owner',
    createdAt: iso(row.created_at),
    lastLoginAt: row.last_login_at ? iso(row.last_login_at) : null,
  };
}

function mapJob(row: any): Job {
  return {
    id: row.id,
    jobNumber: row.job_number,
    customerName: row.customer_name,
    phone: row.phone,
    carModel: row.car_model,
    customerPlate: row.customer_plate,
    confirmedPlate: row.confirmed_plate,
    suggestedPlate: row.suggested_plate,
    services: row.services ?? [],
    price: row.price,
    status: row.status,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function mapStockItem(row: any): StockItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    qty: row.qty,
    unit: row.unit,
    lowAt: row.low_at,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function mapStockPurchase(row: any): StockPurchase {
  return {
    id: row.id,
    stockItemId: row.stock_item_id,
    itemName: row.item_name,
    qty: row.qty,
    unitCost: row.unit_cost,
    totalCost: row.total_cost,
    purchasedAt: iso(row.purchased_at),
    createdAt: iso(row.created_at),
  };
}

function mapReminder(row: any): Reminder {
  return {
    id: row.id,
    text: row.text,
    dueDate: row.due_date ? String(row.due_date).slice(0, 10) : null,
    done: row.done,
    createdAt: iso(row.created_at),
  };
}

function mapVehicleSighting(row: any): VehicleSighting {
  return {
    id: row.id,
    cameraId: row.camera_id,
    plateNumber: row.plate_number,
    confidence: row.confidence,
    imageUrl: row.image_url,
    capturedAt: iso(row.captured_at),
    matchedLeadId: row.matched_lead_id,
    createdAt: iso(row.created_at),
  };
}

// ---------------- Services ----------------

export async function listServices(opts: { activeOnly?: boolean } = {}): Promise<Service[]> {
  const rows = opts.activeOnly
    ? await query('select * from services where is_active = true order by sort_order asc')
    : await query('select * from services order by sort_order asc');
  return rows.map(mapService);
}

export async function getServiceByKey(key: string): Promise<Service | null> {
  const row = await queryOne('select * from services where key = $1', [key]);
  return row ? mapService(row) : null;
}

export async function createService(
  input: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Service> {
  const row = await queryOne(
    `insert into services (key, title, tagline, description, image_url, duration, warranty, process, benefits, sort_order, is_active)
     values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10,$11)
     returning *`,
    [
      input.key,
      input.title,
      input.tagline,
      input.description,
      input.imageUrl,
      input.duration,
      input.warranty,
      JSON.stringify(input.process),
      JSON.stringify(input.benefits),
      input.sortOrder,
      input.isActive,
    ]
  );
  return mapService(row);
}

export async function updateService(
  serviceId: string,
  patch: Partial<Omit<Service, 'id' | 'createdAt'>>
): Promise<Service | null> {
  const existing = await queryOne('select * from services where id = $1', [serviceId]);
  if (!existing) return null;
  const merged = { ...mapService(existing), ...patch };
  const row = await queryOne(
    `update services set
       key = $1, title = $2, tagline = $3, description = $4, image_url = $5,
       duration = $6, warranty = $7, process = $8::jsonb, benefits = $9::jsonb,
       sort_order = $10, is_active = $11
     where id = $12
     returning *`,
    [
      merged.key,
      merged.title,
      merged.tagline,
      merged.description,
      merged.imageUrl,
      merged.duration,
      merged.warranty,
      JSON.stringify(merged.process),
      JSON.stringify(merged.benefits),
      merged.sortOrder,
      merged.isActive,
      serviceId,
    ]
  );
  return row ? mapService(row) : null;
}

export async function deleteService(serviceId: string): Promise<boolean> {
  const rows = await query('delete from services where id = $1 returning id', [serviceId]);
  return rows.length > 0;
}

// ---------------- Gallery ----------------

export async function listGallery(opts: { activeOnly?: boolean } = {}): Promise<GalleryItem[]> {
  const rows = opts.activeOnly
    ? await query('select * from gallery_items where is_active = true order by sort_order asc')
    : await query('select * from gallery_items order by sort_order asc');
  return rows.map(mapGalleryItem);
}

export async function createGalleryItem(
  input: Omit<GalleryItem, 'id' | 'createdAt'>
): Promise<GalleryItem> {
  const row = await queryOne(
    `insert into gallery_items (image_url, caption, wide, sort_order, is_active)
     values ($1,$2,$3,$4,$5)
     returning *`,
    [input.imageUrl, input.caption, input.wide, input.sortOrder, input.isActive]
  );
  return mapGalleryItem(row);
}

export async function updateGalleryItem(
  itemId: string,
  patch: Partial<Omit<GalleryItem, 'id' | 'createdAt'>>
): Promise<GalleryItem | null> {
  const existing = await queryOne('select * from gallery_items where id = $1', [itemId]);
  if (!existing) return null;
  const merged = { ...mapGalleryItem(existing), ...patch };
  const row = await queryOne(
    `update gallery_items set image_url = $1, caption = $2, wide = $3, sort_order = $4, is_active = $5
     where id = $6
     returning *`,
    [merged.imageUrl, merged.caption, merged.wide, merged.sortOrder, merged.isActive, itemId]
  );
  return row ? mapGalleryItem(row) : null;
}

export async function deleteGalleryItem(itemId: string): Promise<boolean> {
  const rows = await query('delete from gallery_items where id = $1 returning id', [itemId]);
  return rows.length > 0;
}

// ---------------- Leads ----------------

export async function listLeads(): Promise<Lead[]> {
  const rows = await query('select * from leads order by created_at desc');
  return rows.map(mapLead);
}

export async function createLead(input: {
  name: string;
  phone: string;
  serviceKey?: string | null;
  message?: string | null;
  source?: string;
}): Promise<Lead> {
  const row = await queryOne(
    `insert into leads (name, phone, service_key, message, source, status)
     values ($1,$2,$3,$4,$5,'new')
     returning *`,
    [input.name, input.phone, input.serviceKey ?? null, input.message ?? null, input.source ?? 'website']
  );
  return mapLead(row);
}

export async function updateLead(
  leadId: string,
  patch: Partial<{ name: string; phone: string; serviceKey: string | null; message: string | null; status: LeadStatus; notes: string | null }>
): Promise<Lead | null> {
  const existing = await queryOne('select * from leads where id = $1', [leadId]);
  if (!existing) return null;
  const merged = { ...mapLead(existing), ...patch };
  const row = await queryOne(
    `update leads set name = $1, phone = $2, service_key = $3, message = $4, status = $5, notes = $6 where id = $7 returning *`,
    [merged.name, merged.phone, merged.serviceKey ?? null, merged.message ?? null, merged.status, merged.notes ?? null, leadId]
  );
  return row ? mapLead(row) : null;
}

export async function deleteLead(leadId: string): Promise<boolean> {
  const rows = await query('delete from leads where id = $1 returning id', [leadId]);
  return rows.length > 0;
}

// ---------------- Admin users ----------------

export async function getAdminByUsername(username: string): Promise<AdminUser | null> {
  const row = await queryOne('select * from admin_users where lower(username) = lower($1)', [username]);
  return row ? mapAdmin(row) : null;
}

export async function getAdminById(adminId: string): Promise<AdminUser | null> {
  const row = await queryOne('select * from admin_users where id = $1', [adminId]);
  return row ? mapAdmin(row) : null;
}

export async function touchAdminLogin(adminId: string): Promise<void> {
  await query('update admin_users set last_login_at = $1 where id = $2', [now(), adminId]);
}

export async function updateAdminPassword(adminId: string, passwordHash: string): Promise<void> {
  await query('update admin_users set password_hash = $1 where id = $2', [passwordHash, adminId]);
}

export async function updateAdminRole(adminId: string, role: AdminRole): Promise<void> {
  await query('update admin_users set role = $1 where id = $2', [role, adminId]);
}

export async function createAdmin(
  username: string,
  passwordHash: string,
  role: AdminRole = 'owner'
): Promise<AdminUser> {
  const row = await queryOne(
    `insert into admin_users (username, password_hash, auth_provider, role) values ($1,$2,'password',$3) returning *`,
    [username, passwordHash, role]
  );
  return mapAdmin(row);
}

/** Auto-provisions a Google-authenticated admin on first successful sign-in. Never has a local password. */
export async function createGoogleAdmin(email: string, role: AdminRole): Promise<AdminUser> {
  const row = await queryOne(
    `insert into admin_users (username, password_hash, auth_provider, role) values ($1, null, 'google', $2) returning *`,
    [email, role]
  );
  return mapAdmin(row);
}

export async function countAdmins(): Promise<number> {
  const row = await queryOne<{ count: string }>('select count(*)::text as count from admin_users');
  return row ? Number(row.count) : 0;
}

// ---------------- Business settings ----------------

export async function getSetting(key: string, fallback = ''): Promise<string> {
  const row = await queryOne<{ value: string }>('select value from business_settings where key = $1', [key]);
  return row?.value ?? fallback;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await query<{ key: string; value: string }>('select key, value from business_settings');
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function setSetting(key: string, value: string): Promise<void> {
  await query(
    `insert into business_settings (key, value) values ($1, $2)
     on conflict (key) do update set value = excluded.value`,
    [key, value]
  );
}

// ---------------- Vehicle sightings (future plate-recognition integration) ----------------

export async function createVehicleSighting(
  input: Omit<VehicleSighting, 'id' | 'createdAt'>
): Promise<VehicleSighting> {
  const row = await queryOne(
    `insert into vehicle_sightings (camera_id, plate_number, confidence, image_url, captured_at, matched_lead_id)
     values ($1,$2,$3,$4,$5,$6)
     returning *`,
    [
      input.cameraId,
      input.plateNumber,
      input.confidence ?? null,
      input.imageUrl ?? null,
      input.capturedAt,
      input.matchedLeadId ?? null,
    ]
  );
  return mapVehicleSighting(row);
}

export async function listVehicleSightings(limit = 50): Promise<VehicleSighting[]> {
  const rows = await query('select * from vehicle_sightings order by created_at desc limit $1', [limit]);
  return rows.map(mapVehicleSighting);
}

// ---------------- Jobs (shop-floor operations) ----------------

export async function listJobs(): Promise<Job[]> {
  const rows = await query('select * from jobs order by created_at desc');
  return rows.map(mapJob);
}

export async function createJob(input: {
  customerName: string;
  phone: string;
  carModel?: string | null;
  customerPlate?: string | null;
  suggestedPlate?: string | null;
  services: string[];
  price: number | null;
}): Promise<Job> {
  const row = await queryOne(
    `insert into jobs (customer_name, phone, car_model, customer_plate, suggested_plate, services, price, status)
     values ($1,$2,$3,$4,$5,$6::jsonb,$7,'draft')
     returning *`,
    [
      input.customerName,
      input.phone,
      input.carModel ?? null,
      input.customerPlate ?? null,
      input.suggestedPlate ?? null,
      JSON.stringify(input.services),
      input.price,
    ]
  );
  return mapJob(row);
}

export async function updateJob(
  jobId: string,
  patch: Partial<{
    customerName: string;
    carModel: string | null;
    customerPlate: string | null;
    confirmedPlate: string | null;
    services: string[];
    price: number | null;
    status: JobStatus;
    phone: string;
  }>
): Promise<Job | null> {
  const existing = await queryOne('select * from jobs where id = $1', [jobId]);
  if (!existing) return null;
  const current = mapJob(existing);
  const merged = { ...current, ...patch };
  const row = await queryOne(
    `update jobs set customer_name = $1, car_model = $2, customer_plate = $3, confirmed_plate = $4,
       services = $5::jsonb, price = $6, status = $7, phone = $8
     where id = $9
     returning *`,
    [
      merged.customerName,
      merged.carModel,
      merged.customerPlate,
      merged.confirmedPlate,
      JSON.stringify(merged.services),
      merged.price,
      merged.status,
      merged.phone,
      jobId,
    ]
  );
  return row ? mapJob(row) : null;
}

export async function searchJobsByPlate(plateQuery: string): Promise<Job[]> {
  const normalized = plateQuery.toUpperCase().replace(/[\s-]/g, '');
  if (!normalized) return [];
  const rows = await query(
    `select * from jobs
     where replace(replace(upper(coalesce(confirmed_plate,'')), ' ', ''), '-', '') like '%' || $1 || '%'
        or replace(replace(upper(coalesce(customer_plate,'')), ' ', ''), '-', '') like '%' || $1 || '%'
     order by created_at desc`,
    [normalized]
  );
  return rows.map(mapJob);
}

export async function deleteJob(jobId: string): Promise<boolean> {
  const rows = await query('delete from jobs where id = $1 returning id', [jobId]);
  return rows.length > 0;
}

// ---------------- Stock & Logistics ----------------

export async function listStockItems(): Promise<StockItem[]> {
  const rows = await query('select * from stock_items order by name asc');
  return rows.map(mapStockItem);
}

export async function createStockItem(input: {
  name: string;
  category: string;
  qty: number;
  unit: string;
  lowAt?: number;
}): Promise<StockItem> {
  const row = await queryOne(
    `insert into stock_items (name, category, qty, unit, low_at) values ($1,$2,$3,$4,$5) returning *`,
    [input.name, input.category, input.qty, input.unit, input.lowAt ?? 3]
  );
  return mapStockItem(row);
}

export async function adjustStockQty(itemId: string, delta: number): Promise<StockItem | null> {
  const row = await queryOne(
    `update stock_items set qty = greatest(0, qty + $1) where id = $2 returning *`,
    [delta, itemId]
  );
  return row ? mapStockItem(row) : null;
}

export async function deleteStockItem(itemId: string): Promise<boolean> {
  const rows = await query('delete from stock_items where id = $1 returning id', [itemId]);
  return rows.length > 0;
}

// ---------------- Stock purchases (owner-only; feeds P&L cost) ----------------

export async function listStockPurchases(): Promise<StockPurchase[]> {
  const rows = await query('select * from stock_purchases order by purchased_at desc');
  return rows.map(mapStockPurchase);
}

/**
 * Logs a purchase and bumps stock on hand -- matching an existing item by
 * exact (case-insensitive) name if one exists, otherwise auto-creating a new
 * stock item so staff are never blocked from logging a purchase just
 * because the item wasn't pre-registered.
 */
export async function createStockPurchase(input: {
  itemName: string;
  qty: number;
  unitCost: number;
}): Promise<StockPurchase> {
  const totalCost = input.qty * input.unitCost;
  const existing = await queryOne<{ id: string }>('select id from stock_items where lower(name) = lower($1)', [
    input.itemName,
  ]);

  let stockItemId: string;
  if (existing) {
    stockItemId = existing.id;
    await query('update stock_items set qty = qty + $1 where id = $2', [input.qty, stockItemId]);
  } else {
    const created = await createStockItem({ name: input.itemName, category: 'Other', qty: input.qty, unit: 'pcs' });
    stockItemId = created.id;
  }

  const row = await queryOne(
    `insert into stock_purchases (stock_item_id, item_name, qty, unit_cost, total_cost)
     values ($1,$2,$3,$4,$5)
     returning *`,
    [stockItemId, input.itemName, input.qty, input.unitCost, totalCost]
  );
  return mapStockPurchase(row);
}

// ---------------- Reminders (owner-only) ----------------

export async function listReminders(): Promise<Reminder[]> {
  const rows = await query('select * from reminders order by done asc, due_date asc nulls last, created_at desc');
  return rows.map(mapReminder);
}

export async function createReminder(text: string, dueDate: string | null): Promise<Reminder> {
  const row = await queryOne('insert into reminders (text, due_date) values ($1,$2) returning *', [text, dueDate]);
  return mapReminder(row);
}

export async function toggleReminder(reminderId: string, done: boolean): Promise<Reminder | null> {
  const row = await queryOne('update reminders set done = $1 where id = $2 returning *', [done, reminderId]);
  return row ? mapReminder(row) : null;
}

export async function deleteReminder(reminderId: string): Promise<boolean> {
  const rows = await query('delete from reminders where id = $1 returning id', [reminderId]);
  return rows.length > 0;
}

// ---------------- P&L (owner-only) ----------------

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Calendar-day/week/month boundaries computed in IST (Asia/Kolkata), not server-local time. */
function periodBounds(period: 'today' | 'week' | 'month' | 'all'): { start: Date | null; end: Date | null } {
  if (period === 'all') return { start: null, end: null };

  const nowIst = new Date(Date.now() + IST_OFFSET_MS);
  const y = nowIst.getUTCFullYear();
  const m = nowIst.getUTCMonth();
  const d = nowIst.getUTCDate();

  const toUtc = (ms: number) => new Date(ms - IST_OFFSET_MS);

  if (period === 'today') {
    return { start: toUtc(Date.UTC(y, m, d)), end: toUtc(Date.UTC(y, m, d + 1)) };
  }
  if (period === 'week') {
    const dow = nowIst.getUTCDay(); // 0 = Sunday, matching the prototype's week start
    return { start: toUtc(Date.UTC(y, m, d - dow)), end: toUtc(Date.UTC(y, m, d - dow + 7)) };
  }
  // month
  return { start: toUtc(Date.UTC(y, m, 1)), end: toUtc(Date.UTC(y, m + 1, 1)) };
}

export async function getPnlSummary(period: 'today' | 'week' | 'month' | 'all'): Promise<PnlSummary> {
  const { start, end } = periodBounds(period);

  const jobRows = start
    ? await query(
        `select * from jobs where status != 'draft' and created_at >= $1 and created_at < $2 order by created_at desc`,
        [start.toISOString(), end!.toISOString()]
      )
    : await query(`select * from jobs where status != 'draft' order by created_at desc`);

  const purchaseRows = start
    ? await query(
        `select * from stock_purchases where purchased_at >= $1 and purchased_at < $2 order by purchased_at desc`,
        [start.toISOString(), end!.toISOString()]
      )
    : await query(`select * from stock_purchases order by purchased_at desc`);

  const revenueJobs = jobRows.map(mapJob);
  const costPurchases = purchaseRows.map(mapStockPurchase);
  const revenue = revenueJobs.reduce((sum, j) => sum + (j.price || 0), 0);
  const cost = costPurchases.reduce((sum, p) => sum + (p.totalCost || 0), 0);

  return { period, revenue, cost, profit: revenue - cost, revenueJobs, costPurchases };
}
