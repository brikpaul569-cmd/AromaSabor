import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProposalsController } from './proposals.controller';
import { ClientProposalsController } from './client-proposals.controller';
import { ProposalsService } from './proposals.service';
import { Proposal, ProposalSchema } from '../../schemas/proposal.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Proposal.name, schema: ProposalSchema }]),
    NotificationsModule,
  ],
  controllers: [ClientProposalsController, ProposalsController],
  providers: [ProposalsService],
  exports: [ProposalsService],
})
export class ProposalsModule {}
