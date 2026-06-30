import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'Proposal', required: true })
  proposalId!: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['proposal_created', 'proposal_updated', 'proposal_accepted', 'proposal_rejected', 'proposal_expired', 'proposal_client_responded'],
  })
  type!: string;

  @Prop({ required: true })
  message!: string;

  @Prop({ default: false })
  read!: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ read: 1, createdAt: -1 });
