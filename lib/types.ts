export interface Service {
  id: string;
  key: string;
  title: string;
  tagline: string;
  description: string;
  imageUrl: string;
  duration: string;
  warranty: string;
  process: string[];
  benefits: string[];
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  caption: string;
  wide: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export type LeadStatus = 'new' | 'contacted' | 'booked' | 'completed' | 'lost';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  serviceKey?: string | null;
  message?: string | null;
  source: string;
  status: LeadStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AdminAuthProvider = 'password' | 'google';
export type AdminRole = 'owner' | 'staff';

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string | null;
  authProvider: AdminAuthProvider;
  role: AdminRole;
  createdAt: string;
  lastLoginAt?: string | null;
}

// ---------------- Shop-floor operations (z-lab-internal-ops console) ----------------

export type JobStatus = 'draft' | 'active' | 'delivered';

export interface Job {
  id: string;
  jobNumber: string;
  customerName: string;
  phone: string;
  carModel?: string | null;
  customerPlate?: string | null;
  confirmedPlate?: string | null;
  suggestedPlate?: string | null;
  services: string[];
  price: number | null;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StockItem {
  id: string;
  name: string;
  category: string;
  qty: number;
  unit: string;
  lowAt: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockPurchase {
  id: string;
  stockItemId?: string | null;
  itemName: string;
  qty: number;
  unitCost: number;
  totalCost: number;
  purchasedAt: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  text: string;
  dueDate?: string | null;
  done: boolean;
  createdAt: string;
}

export interface PnlSummary {
  period: 'today' | 'week' | 'month' | 'all';
  revenue: number;
  cost: number;
  profit: number;
  revenueJobs: Job[];
  costPurchases: StockPurchase[];
}

export interface BusinessSetting {
  key: string;
  value: string;
}

// Future integration (not wired to hardware yet): fixed single-camera plate
// recognition -- see db/schema.sql and app/api/integrations/plate-recognition.
export interface VehicleSighting {
  id: string;
  cameraId: string;
  plateNumber: string;
  confidence?: number | null;
  imageUrl?: string | null;
  capturedAt: string;
  matchedLeadId?: string | null;
  createdAt: string;
}
