import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MenuDocument = HydratedDocument<Menu>;

@Schema()
class MenuItem {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, enum: ['entrada', 'plato_fuerte', 'guarnicion', 'postre'] })
  category!: string;

  @Prop({ required: true, min: 0 })
  price!: number;
}

const MenuItemSchema = SchemaFactory.createForClass(MenuItem);

@Schema({ timestamps: true })
export class Menu {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true })
  slug!: string;

  @Prop({ default: '' })
  description?: string;

  @Prop({ type: [MenuItemSchema], default: [] })
  items!: MenuItem[];

  @Prop({ default: false })
  isActive!: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Admin', required: true })
  createdBy!: Types.ObjectId;
}

export const MenuSchema = SchemaFactory.createForClass(Menu);
MenuSchema.index({ slug: 1 }, { unique: true });
MenuSchema.index({ createdBy: 1 });
