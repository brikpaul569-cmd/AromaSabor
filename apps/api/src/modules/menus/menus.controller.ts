import {
  Controller, Get, Post, Body, Param, Patch, Delete, UseGuards,
} from '@nestjs/common';
import { MenusService } from './menus.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('menus')
export class MenusController {
  constructor(private menusService: MenusService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() body: { name: string; description?: string },
    @CurrentUser() user: any,
  ) {
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
  @Post(':id/items')
  addItem(@Param('id') id: string, @Body() body: { name: string; description: string; category: string; price: number }) {
    return this.menusService.addItem(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/items/:itemId')
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: { name?: string; description?: string; category?: string; price?: number },
  ) {
    return this.menusService.updateItem(id, itemId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/items/:itemId')
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.menusService.removeItem(id, itemId);
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
