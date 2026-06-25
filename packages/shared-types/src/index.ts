// ── Enums ──

export type CategoryType = 'entrada' | 'plato_fuerte' | 'guarnicion' | 'postre';
export type ProposalStatus = 'borrador' | 'enviado' | 'modificado_por_cliente' | 'modificado_por_chef' | 'aceptado' | 'rechazado' | 'expirado';
export type EditorRole = 'chef' | 'cliente';

// ── Admin ──

export interface Admin {
  _id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'admin';
  createdAt: string;
  updatedAt: string;
}

// ── Menu ──

export interface MenuItem {
  _id: string;
  name: string;
  description: string;
  category: CategoryType;
  price: number;
  weight?: number;
}

export interface Menu {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  items: MenuItem[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ── Proposal ──

export interface ProposalItem extends MenuItem {
  quantity: number;
}

export interface EditHistoryEntry {
  modifiedBy: EditorRole;
  modifiedAt: string;
  note?: string;
}

export interface Proposal {
  _id: string;
  menuId: string;
  token: string;
  clientName: string;
  eventDate: string;
  guestCount: number;
  items: ProposalItem[];
  notes: string;
  status: ProposalStatus;
  quotation: number;
  createdBy: string;
  expiresAt: string;
  lastModifiedBy?: EditorRole;
  lastModifiedAt?: string;
  editHistory?: EditHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

// ── Notification ──

export type NotificationType = 'proposal_created' | 'proposal_updated' | 'proposal_accepted' | 'proposal_rejected' | 'proposal_expired';

export interface Notification {
  _id: string;
  proposalId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
}

// ── Auth ──

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  admin: Pick<Admin, '_id' | 'email' | 'name'>;
}

// ── API ──

export interface ApiError {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
