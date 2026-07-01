import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Query } from '@nestjs/common';
import { ProposalsService } from './proposals.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { ClaimDto } from './dto/claim.dto';

@Controller('proposals')
export class ProposalsController {
  constructor(private proposalsService: ProposalsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: CreateProposalDto, @CurrentUser() user: any) {
    return this.proposalsService.create(body, user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/send')
  send(@Param('id') id: string) {
    return this.proposalsService.send(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.proposalsService.approve(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.proposalsService.reject(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  transitionStatus(
    @Param('id') id: string,
    @Body() body: { status: string; modifiedBy: 'chef' | 'cliente'; reason?: string },
  ) {
    return this.proposalsService.transitionStatus(id, body.status, body.modifiedBy, body.reason);
  }

  @UseGuards(JwtAuthGuard)
  @Get('id/:id')
  findById(@Param('id') id: string) {
    return this.proposalsService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('id/:id/history')
  getHistory(@Param('id') id: string) {
    return this.proposalsService.getHistory(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('id/:id/timeline')
  getTimeline(@Param('id') id: string) {
    return this.proposalsService.getTimeline(id);
  }

  @Get('code/:shortCode')
  findByShortCode(@Param('shortCode') shortCode: string) {
    return this.proposalsService.findByShortCode(shortCode);
  }

  @Get(':token')
  findByToken(@Param('token') token: string) {
    return this.proposalsService.findByToken(token);
  }

  @Patch('token/:token/items')
  updateByToken(
    @Param('token') token: string,
    @Body() body: { items: any[]; guestCount?: number; reason?: string },
  ) {
    return this.proposalsService.updateByToken(token, body);
  }

  @Patch('token/:token/respond')
  respondItems(
    @Param('token') token: string,
    @Body() body: { items: { _id: string; itemStatus: string }[] },
  ) {
    return this.proposalsService.submitItemResponse(token, body.items);
  }

  @Patch('token/:token/approve')
  approveByToken(@Param('token') token: string) {
    return this.proposalsService.approveByToken(token);
  }

  @Patch('token/:token/reject')
  rejectByToken(@Param('token') token: string) {
    return this.proposalsService.rejectByToken(token);
  }

  @Post('token/:token/claim')
  claim(@Param('token') token: string, @Body() dto: ClaimDto) {
    return this.proposalsService.claim(token, dto.clientName);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('status') status?: string) {
    return this.proposalsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.proposalsService.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.proposalsService.remove(id);
  }
}
