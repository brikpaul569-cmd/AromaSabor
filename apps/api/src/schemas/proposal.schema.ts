import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProposalDocument = HydratedDocument<Proposal>;

export const VALID_TRANSITIONS: Record<string, string[]> = {
  borrador: ['enviado'],
  enviado: ['modificado_por_cliente', 'modificado_por_chef', 'respuesta_parcial', 'aceptado', 'rechazado', 'expirado'],
  modificado_por_cliente: ['modificado_por_chef', 'aceptado', 'rechazado', 'expirado'],
  modificado_por_chef: ['modificado_por_cliente', 'respuesta_parcial', 'aceptado', 'rechazado', 'expirado'],
  respuesta_parcial: ['modificado_por_chef', 'aceptado', 'rechazado', 'expirado'],
  aceptado: [],
  rechazado: [],
  expirado: [],
};

@Schema()
export class ProposalItem {
  @Prop({ required: true })
  name!: string;

  @Prop({ default: '' })
  description?: string;

  @Prop({ required: true })
  categoryId!: string;

  @Prop({ required: true })
  categoryLabel!: string;

  @Prop({ required: true, min: 0 })
  pricePerPortion!: number;

  @Prop({ min: 0 })
  portionGrams?: number;

  @Prop({ default: 'gr' })
  unit?: string;

  @Prop({ required: true, min: 1 })
  quantity!: number;

  @Prop({ enum: ['pendiente', 'aceptado', 'rechazado'], default: 'pendiente' })
  itemStatus?: string;
}

const ProposalItemSchema = SchemaFactory.createForClass(ProposalItem);

@Schema()
class ClientInfo {
  @Prop()
  phone?: string;

  @Prop()
  email?: string;

  @Prop()
  eventType?: string;
}

const ClientInfoSchema = SchemaFactory.createForClass(ClientInfo);

@Schema()
class EditHistoryEntry {
  @Prop({ required: true, enum: ['chef', 'cliente'] })
  modifiedBy!: string;

  @Prop({ required: true })
  modifiedAt!: Date;

  @Prop()
  note?: string;

  @Prop({ type: [ProposalItemSchema], default: [] })
  previousItems?: ProposalItem[];

  @Prop({ type: [ProposalItemSchema], default: [] })
  newItems?: ProposalItem[];

  @Prop()
  reason?: string;
}

const EditHistoryEntrySchema = SchemaFactory.createForClass(EditHistoryEntry);

@Schema({ timestamps: true })
export class Proposal {
  @Prop({ type: Types.ObjectId, ref: 'Menu', required: true })
  menuId!: Types.ObjectId;

  @Prop({ required: true, unique: true })
  token!: string;

  @Prop({ required: true })
  clientName!: string;

  @Prop({ required: true })
  eventDate!: string;

  @Prop({ required: true, min: 1 })
  guestCount!: number;

  @Prop({ type: ClientInfoSchema })
  clientInfo?: ClientInfo;

  @Prop({ type: [ProposalItemSchema], default: [] })
  items!: ProposalItem[];

  @Prop({ default: '' })
  notes!: string;

  @Prop({ default: '' })
  adminNotes?: string;

  @Prop({ default: 0, min: 0 })
  pricePerPlate?: number;

  @Prop({ default: 0, min: 0 })
  totalPrice?: number;

  @Prop({
    required: true,
    enum: Object.keys(VALID_TRANSITIONS),
    default: 'borrador',
  })
  status!: string;

  @Prop({ required: true, min: 0 })
  quotation!: number;

  @Prop({ type: Types.ObjectId, ref: 'Admin', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ unique: true, sparse: true })
  shortCode?: string;

  @Prop()
  claimedAt?: Date;

  @Prop()
  claimedByClientName?: string;

  @Prop()
  viewedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Client', default: null })
  clientId?: Types.ObjectId | null;

  @Prop({ enum: ['chef', 'cliente'] })
  lastModifiedBy?: string;

  @Prop()
  lastModifiedAt?: Date;

  @Prop({ type: [EditHistoryEntrySchema], default: [] })
  editHistory?: EditHistoryEntry[];
}

export const ProposalSchema = SchemaFactory.createForClass(Proposal);
ProposalSchema.index({ token: 1 }, { unique: true });
ProposalSchema.index({ status: 1, expiresAt: 1 });
ProposalSchema.index({ createdBy: 1 });

