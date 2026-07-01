import { Controller, Get, Param, Patch, Body, UseGuards } from '@nestjs/common';
import { ProposalsService } from './proposals.service';
import { ClientGuard } from '../client-auth/client.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('proposals/client')
@UseGuards(ClientGuard)
export class ClientProposalsController {
  constructor(private proposalsService: ProposalsService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.proposalsService.findByClientId(user._id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.proposalsService.findByIdAndClient(id, user._id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { items?: any[]; guestCount?: number },
    @CurrentUser() user: any,
  ) {
    return this.proposalsService.updateByClient(id, user._id, body);
  }
}
