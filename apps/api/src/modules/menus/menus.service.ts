import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Menu } from '../../schemas/menu.schema';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'untitled';
}

@Injectable()
export class MenusService {
  constructor(@InjectModel(Menu.name) private menuModel: Model<Menu>) {}

  async create(data: { name: string; description?: string }, adminId: string) {
    let slug = slugify(data.name);
    const existing = await this.menuModel.findOne({ slug });
    if (existing) slug = `${slug}-${Date.now()}`;

    const menu = new this.menuModel({
      name: data.name,
      slug,
      description: data.description || '',
      createdBy: new Types.ObjectId(adminId),
    });
    return menu.save();
  }

  async findAll() {
    return this.menuModel.find().sort({ createdAt: -1 }).populate('createdBy', 'name email');
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid menu ID');
    const menu = await this.menuModel.findById(id).populate('createdBy', 'name email');
    if (!menu) throw new NotFoundException('Menu not found');
    return menu;
  }

  async addItem(menuId: string, item: { name: string; description: string; category: string; price: number }) {
    if (!Types.ObjectId.isValid(menuId)) throw new NotFoundException('Invalid menu ID');
    if (!['entrada', 'plato_fuerte', 'guarnicion', 'postre'].includes(item.category)) {
      throw new BadRequestException('Invalid category');
    }
    const menu = await this.menuModel.findById(menuId);
    if (!menu) throw new NotFoundException('Menu not found');
    menu.items.push(item as any);
    return menu.save();
  }

  async updateItem(menuId: string, itemId: string, data: { name?: string; description?: string; category?: string; price?: number; weight?: number }) {
    if (!Types.ObjectId.isValid(menuId) || !Types.ObjectId.isValid(itemId)) {
      throw new NotFoundException('Invalid ID');
    }
    if (data.category && !['entrada', 'plato_fuerte', 'guarnicion', 'postre'].includes(data.category)) {
      throw new BadRequestException('Invalid category');
    }
    const menu = await this.menuModel.findOneAndUpdate(
      { _id: menuId, 'items._id': itemId },
      {
        $set: {
          ...(data.name && { 'items.$.name': data.name }),
          ...(data.description !== undefined && { 'items.$.description': data.description }),
          ...(data.category && { 'items.$.category': data.category }),
          ...(data.price !== undefined && { 'items.$.price': data.price }),
          ...(data.weight !== undefined && { 'items.$.weight': data.weight }),
        },
      },
      { new: true },
    );
    if (!menu) throw new NotFoundException('Menu or item not found');
    return menu;
  }

  async removeItem(menuId: string, itemId: string) {
    if (!Types.ObjectId.isValid(menuId) || !Types.ObjectId.isValid(itemId)) {
      throw new NotFoundException('Invalid ID');
    }
    const menu = await this.menuModel.findByIdAndUpdate(
      menuId,
      { $pull: { items: { _id: itemId } } },
      { new: true },
    );
    if (!menu) throw new NotFoundException('Menu not found');
    return menu;
  }

  async publish(id: string, active: boolean) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid menu ID');
    const menu = await this.menuModel.findByIdAndUpdate(id, { isActive: active }, { new: true });
    if (!menu) throw new NotFoundException('Menu not found');
    return menu;
  }

  async findBySlug(slug: string) {
    const menu = await this.menuModel.findOne({ slug, isActive: true }).populate('createdBy', 'name');
    if (!menu) throw new NotFoundException('Menu not found or not published');
    return menu;
  }

  async update(id: string, data: Partial<Menu>) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid menu ID');
    const menu = await this.menuModel.findByIdAndUpdate(id, data, { new: true });
    if (!menu) throw new NotFoundException('Menu not found');
    return menu;
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid menu ID');
    const menu = await this.menuModel.findByIdAndDelete(id);
    if (!menu) throw new NotFoundException('Menu not found');
    return menu;
  }
}
