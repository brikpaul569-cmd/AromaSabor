import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Menu } from '../../schemas/menu.schema';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
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

  async addCategory(menuId: string, data: { id: string; label: string; maxItems: number }) {
    if (!Types.ObjectId.isValid(menuId)) throw new NotFoundException('Invalid menu ID');
    const menu = await this.menuModel.findByIdAndUpdate(
      menuId,
      { $push: { categories: { id: data.id, label: data.label, maxItems: data.maxItems, items: [] } } },
      { new: true },
    );
    if (!menu) throw new NotFoundException('Menu not found');
    return menu;
  }

  async updateCategory(menuId: string, categoryId: string, data: { id?: string; label?: string; maxItems?: number }) {
    if (!Types.ObjectId.isValid(menuId) || !Types.ObjectId.isValid(categoryId)) {
      throw new NotFoundException('Invalid ID');
    }
    const update: Record<string, any> = {};
    if (data.id !== undefined) update['categories.$.id'] = data.id;
    if (data.label !== undefined) update['categories.$.label'] = data.label;
    if (data.maxItems !== undefined) update['categories.$.maxItems'] = data.maxItems;

    const menu = await this.menuModel.findOneAndUpdate(
      { _id: menuId, 'categories._id': categoryId },
      { $set: update },
      { new: true },
    );
    if (!menu) throw new NotFoundException('Menu or category not found');
    return menu;
  }

  async removeCategory(menuId: string, categoryId: string) {
    if (!Types.ObjectId.isValid(menuId) || !Types.ObjectId.isValid(categoryId)) {
      throw new NotFoundException('Invalid ID');
    }
    const menu = await this.menuModel.findByIdAndUpdate(
      menuId,
      { $pull: { categories: { _id: categoryId } } },
      { new: true },
    );
    if (!menu) throw new NotFoundException('Menu not found');
    return menu;
  }

  async addItem(
    menuId: string,
    categoryId: string,
    item: { name: string; description?: string; pricePerPortion: number; portionGrams?: number; unit?: string; isAvailable?: boolean; imageUrl?: string },
  ) {
    if (!Types.ObjectId.isValid(menuId) || !Types.ObjectId.isValid(categoryId)) {
      throw new NotFoundException('Invalid ID');
    }
    const menu = await this.menuModel.findOneAndUpdate(
      { _id: menuId, 'categories._id': categoryId },
      { $push: { 'categories.$.items': item } },
      { new: true },
    );
    if (!menu) throw new NotFoundException('Menu or category not found');
    return menu;
  }

  async updateItem(
    menuId: string,
    categoryId: string,
    itemId: string,
    data: { name?: string; description?: string; pricePerPortion?: number; portionGrams?: number; unit?: string; isAvailable?: boolean; imageUrl?: string },
  ) {
    if (!Types.ObjectId.isValid(menuId) || !Types.ObjectId.isValid(categoryId) || !Types.ObjectId.isValid(itemId)) {
      throw new NotFoundException('Invalid ID');
    }
    const update: Record<string, any> = {};
    if (data.name !== undefined) update['categories.$[cat].items.$[item].name'] = data.name;
    if (data.description !== undefined) update['categories.$[cat].items.$[item].description'] = data.description;
    if (data.pricePerPortion !== undefined) update['categories.$[cat].items.$[item].pricePerPortion'] = data.pricePerPortion;
    if (data.portionGrams !== undefined) update['categories.$[cat].items.$[item].portionGrams'] = data.portionGrams;
    if (data.unit !== undefined) update['categories.$[cat].items.$[item].unit'] = data.unit;
    if (data.isAvailable !== undefined) update['categories.$[cat].items.$[item].isAvailable'] = data.isAvailable;
    if (data.imageUrl !== undefined) update['categories.$[cat].items.$[item].imageUrl'] = data.imageUrl;

    const menu = await this.menuModel.findOneAndUpdate(
      { _id: menuId },
      { $set: update },
      { arrayFilters: [{ 'cat._id': categoryId }, { 'item._id': itemId }], new: true },
    );
    if (!menu) throw new NotFoundException('Menu or item not found');
    return menu;
  }

  async removeItem(menuId: string, categoryId: string, itemId: string) {
    if (!Types.ObjectId.isValid(menuId) || !Types.ObjectId.isValid(categoryId) || !Types.ObjectId.isValid(itemId)) {
      throw new NotFoundException('Invalid ID');
    }
    const menu = await this.menuModel.findOneAndUpdate(
      { _id: menuId, 'categories._id': categoryId },
      { $pull: { 'categories.$.items': { _id: itemId } } },
      { new: true },
    );
    if (!menu) throw new NotFoundException('Menu or item not found');
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
