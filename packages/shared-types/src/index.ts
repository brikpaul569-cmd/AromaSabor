export type ProposalStatus = 'borrador' | 'enviado' | 'modificado_por_cliente' | 'modificado_por_chef' | 'respuesta_parcial' | 'aceptado' | 'rechazado' | 'expirado';
export type ItemStatus = 'pendiente' | 'aceptado' | 'rechazado';
export type EditorRole = 'chef' | 'cliente';

export interface Admin {
  _id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  portionGrams?: number;
  pricePerPortion: number;
  unit: string;
  isAvailable: boolean;
}

export interface MenuCategory {
  _id: string;
  id: string;
  label: string;
  maxItems: number;
  items: MenuItem[];
}

export interface Menu {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  categories: MenuCategory[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalItem {
  _id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryLabel: string;
  pricePerPortion: number;
  portionGrams?: number;
  unit: string;
  quantity: number;
  itemStatus: ItemStatus;
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
  shortCode?: string;
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
  claimedAt?: string;
  claimedByClientName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  type: 'created' | 'sent' | 'chef_modified' | 'client_modified'
      | 'client_responded' | 'claimed' | 'accepted' | 'rejected' | 'expired';
  timestamp: string;
  label: string;
  description?: string;
}

export type NotificationType = 'proposal_created' | 'proposal_updated' | 'proposal_accepted' | 'proposal_rejected' | 'proposal_expired' | 'proposal_client_responded';

export interface Notification {
  _id: string;
  proposalId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  admin: Pick<Admin, '_id' | 'email' | 'name'>;
}

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
