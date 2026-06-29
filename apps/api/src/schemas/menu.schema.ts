import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MenuDocument = HydratedDocument<Menu>;

@Schema()
class MenuCategoryItem {
  @Prop({ required: true })
  name!: string;

  @Prop({ default: '' })
  description?: string;

  @Prop()
  imageUrl?: string;

  @Prop({ min: 0 })
  portionGrams?: number;

  @Prop({ required: true, min: 0 })
  pricePerPortion!: number;

  @Prop({ default: 'gr' })
  unit?: string;

  @Prop({ default: true })
  isAvailable?: boolean;
}

const MenuCategoryItemSchema = SchemaFactory.createForClass(MenuCategoryItem);

@Schema()
class MenuCategory {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  label!: string;

  @Prop({ required: true, min: 1, default: 1 })
  maxItems!: number;

  @Prop({ type: [MenuCategoryItemSchema], default: [] })
  items!: MenuCategoryItem[];
}

const MenuCategorySchema = SchemaFactory.createForClass(MenuCategory);

@Schema({ timestamps: true })
export class Menu {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true })
  slug!: string;

  @Prop({ default: '' })
  description?: string;

  @Prop({ type: [MenuCategorySchema], default: [] })
  categories!: MenuCategory[];

  @Prop({ default: false })
  isActive!: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Admin', required: true })
  createdBy!: Types.ObjectId;
}

export const MenuSchema = SchemaFactory.createForClass(Menu);
MenuSchema.index({ slug: 1 }, { unique: true });
MenuSchema.index({ createdBy: 1 });
