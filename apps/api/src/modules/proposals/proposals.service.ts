import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Proposal } from '../../schemas/proposal.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProposalsService {
  constructor(
    @InjectModel(Proposal.name) private proposalModel: Model<Proposal>,
    private notificationsService: NotificationsService,
  ) {}

  async create(data: Partial<Proposal>) {
    const proposal = new this.proposalModel({
      ...data,
      token: uuidv4(),
    });
    const saved = await proposal.save();
    await this.notificationsService.create({
      proposalId: saved._id,
      type: 'proposal_created',
      message: `Proposal for ${saved.clientName} has been created`,
    });
    return saved;
  }

  async findByToken(token: string) {
    const proposal = await this.proposalModel.findOne({ token }).populate('menuId');
    if (!proposal) throw new NotFoundException('Proposal not found');
    return proposal;
  }

  async findAll() {
    return this.proposalModel.find().sort({ createdAt: -1 }).populate('createdBy', 'name email');
  }

  async update(id: string, data: Partial<Proposal>) {
    const proposal = await this.proposalModel.findByIdAndUpdate(id, data, { new: true });
    if (!proposal) throw new NotFoundException('Proposal not found');
    await this.notificationsService.create({
      proposalId: proposal._id,
      type: 'proposal_updated',
      message: `Proposal for ${proposal.clientName} has been updated`,
    });
    return proposal;
  }

  async remove(id: string) {
    const proposal = await this.proposalModel.findByIdAndDelete(id);
    if (!proposal) throw new NotFoundException('Proposal not found');
    return proposal;
  }
}
