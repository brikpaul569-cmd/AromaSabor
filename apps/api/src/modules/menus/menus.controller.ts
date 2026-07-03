import {
  Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, BadRequestException,
} from '@nestjs/common';
import { MenusService } from './menus.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProposalsService } from '../proposals/proposals.service';

@Controller('menus')
export class MenusController {
  constructor(
    private menusService: MenusService,
    private proposalsService: ProposalsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: { name: string; description?: string }, @CurrentUser() user: any) {
    return this.menusService.create(body, user._id);
  }

  @Get()
  findAll() {
    return this.menusService.findAll();
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.menusService.findBySlug(slug);
  }

  @Post(':slug/submit-plate')
  async submitPlate(
    @Param('slug') slug: string,
    @Body() body: {
      items: { _id: string; categoryId: string }[];
      guestCount: number;
      clientName?: string;
      notes?: string;
    },
  ) {
    if (!body.items?.length) throw new BadRequestException('At least one item is required');
    if (!body.guestCount || body.guestCount < 1) throw new BadRequestException('guestCount must be at least 1');

    const menu = await this.menusService.findBySlug(slug);
    return this.proposalsService.submitFromMenu(
      menu,
      body.items,
      body.guestCount,
      body.clientName,
      body.notes,
    );
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.menusService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/publish')
  publish(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.menusService.publish(id, body.isActive);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/categories')
  addCategory(@Param('id') id: string, @Body() body: { id: string; label: string; maxItems: number }) {
    return this.menusService.addCategory(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/categories/:categoryId')
  updateCategory(
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
    @Body() body: { id?: string; label?: string; maxItems?: number },
  ) {
    return this.menusService.updateCategory(id, categoryId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/categories/:categoryId')
  removeCategory(@Param('id') id: string, @Param('categoryId') categoryId: string) {
    return this.menusService.removeCategory(id, categoryId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/categories/:categoryId/items')
  addItem(
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
    @Body() body: { name: string; description?: string; pricePerPortion: number; portionGrams?: number; unit?: string; isAvailable?: boolean; imageUrl?: string },
  ) {
    return this.menusService.addItem(id, categoryId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/categories/:categoryId/items/:itemId')
  updateItem(
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
    @Param('itemId') itemId: string,
    @Body() body: { name?: string; description?: string; pricePerPortion?: number; portionGrams?: number; unit?: string; isAvailable?: boolean; imageUrl?: string },
  ) {
    return this.menusService.updateItem(id, categoryId, itemId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/categories/:categoryId/items/:itemId')
  removeItem(@Param('id') id: string, @Param('categoryId') categoryId: string, @Param('itemId') itemId: string) {
    return this.menusService.removeItem(id, categoryId, itemId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.menusService.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.menusService.remove(id);
  }
}
