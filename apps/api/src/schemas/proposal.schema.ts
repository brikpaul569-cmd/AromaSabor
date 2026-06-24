import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProposalDocument = HydratedDocument<Proposal>;

@Schema()
class ProposalItem {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, enum: ['entrada', 'plato_fuerte', 'guarnicion', 'postre'] })
  category!: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ required: true, min: 1 })
  quantity!: number;
}

const ProposalItemSchema = SchemaFactory.createForClass(ProposalItem);

@Schema()
class EditHistoryEntry {
  @Prop({ required: true, enum: ['chef', 'cliente'] })
  modifiedBy!: string;

  @Prop({ required: true })
  modifiedAt!: Date;

  @Prop()
  note?: string;
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

  @Prop({ type: [ProposalItemSchema], default: [] })
  items!: ProposalItem[];

  @Prop({ default: '' })
  notes!: string;

  @Prop({
    required: true,
    enum: ['borrador', 'enviado', 'modificado_por_cliente', 'modificado_por_chef', 'aceptado', 'rechazado', 'expirado'],
    default: 'borrador',
  })
  status!: string;

  @Prop({ required: true, min: 0 })
  quotation!: number;

  @Prop({ type: Types.ObjectId, ref: 'Admin', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ required: true })
  expiresAt!: Date;

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
