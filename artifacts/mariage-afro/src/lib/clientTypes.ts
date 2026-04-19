export interface BudgetItem {
  id: number;
  category: string;
  vendor: string | null;
  planned: number;
  actual: number;
  paid: boolean;
  notes: string | null;
}
export interface BudgetItemCreate {
  category: string;
  vendor?: string | null;
  planned?: number;
  actual?: number;
  paid?: boolean;
  notes?: string | null;
}
export type BudgetItemPatch = Partial<BudgetItemCreate>;

export interface Guest {
  id: number;
  firstName: string;
  lastName: string;
  side: string;
  table: string | null;
  rsvp: string;
  diet: string | null;
  email: string | null;
  notes: string | null;
}
export interface GuestCreate {
  firstName: string;
  lastName?: string;
  side?: string;
  table?: string | null;
  rsvp?: string;
  diet?: string | null;
  email?: string | null;
  notes?: string | null;
}
export type GuestPatch = Partial<GuestCreate>;

export interface PlanningTask {
  id: number;
  title: string;
  dueDate: string | null;
  assignee: string | null;
  done: boolean;
  category: string;
  notes: string | null;
}
export interface PlanningTaskCreate {
  title: string;
  dueDate?: string | null;
  assignee?: string | null;
  done?: boolean;
  category?: string;
  notes?: string | null;
}
export type PlanningTaskPatch = Partial<PlanningTaskCreate>;

export interface ClientVendor {
  id: number;
  category: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  amount: number;
  status: string;
  notes: string | null;
}
export interface ClientVendorCreate {
  category: string;
  name: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  amount?: number;
  status?: string;
  notes?: string | null;
}
export type ClientVendorPatch = Partial<ClientVendorCreate>;

export interface JourJEvent {
  id: number;
  time: string;
  title: string;
  responsible: string | null;
  done: boolean;
  notes: string | null;
}
export interface JourJEventCreate {
  time: string;
  title: string;
  responsible?: string | null;
  done?: boolean;
  notes?: string | null;
}
export type JourJEventPatch = Partial<JourJEventCreate>;
