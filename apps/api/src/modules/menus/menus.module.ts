import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MenusController } from './menus.controller';
import { MenusService } from './menus.service';
import { Menu, MenuSchema } from '../../schemas/menu.schema';
import { ProposalsModule } from '../proposals/proposals.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Menu.name, schema: MenuSchema }]),
    ProposalsModule,
  ],
  controllers: [MenusController],
  providers: [MenusService],
})
export class MenusModule {}
