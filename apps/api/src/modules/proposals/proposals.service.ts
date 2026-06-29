import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Proposal } from '../../schemas/proposal.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { calculateQuotation } from '@aromasabor/utils';

@Injectable()
export class ProposalsService {
  constructor(
    @InjectModel(Proposal.name) private proposalModel: Model<Proposal>,
    private notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateProposalDto, userId: string) {
    const quotation = calculateQuotation(
      dto.items.map((i) => ({ price: i.pricePerPortion, quantity: dto.guestCount })),
    );

    const proposal = new this.proposalModel({
      menuId: new Types.ObjectId(dto.menuId),
      token: uuidv4(),
      clientName: dto.clientName,
      eventDate: dto.eventDate,
      guestCount: dto.guestCount,
      items: dto.items,
      notes: dto.notes ?? '',
      status: 'borrador',
      quotation: quotation.total,
      expiresAt: new Date(0),
      createdBy: new Types.ObjectId(userId),
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
    if (proposal.status === 'enviado' && proposal.expiresAt < new Date()) {
      proposal.status = 'expirado';
    }
    if (!proposal.viewedAt) {
      proposal.viewedAt = new Date();
    }
    await proposal.save();
    return proposal;
  }

  async findAll() {
    return this.proposalModel.find().sort({ createdAt: -1 }).populate('createdBy', 'name email');
  }

  async send(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid proposal ID');
    const proposal = await this.proposalModel.findById(id);
    if (!proposal) throw new NotFoundException('Proposal not found');
    if (proposal.status !== 'borrador') {
      throw new ConflictException(`Cannot send proposal with status "${proposal.status}". Only "borrador" proposals can be sent.`);
    }
    proposal.status = 'enviado';
    proposal.expiresAt = new Date(Date.now() + 20 * 60 * 1000);
    const saved = await proposal.save();
    await this.notificationsService.create({
      proposalId: saved._id,
      type: 'proposal_updated',
      message: `Proposal for ${saved.clientName} has been sent to client`,
    });
    return saved;
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid proposal ID');
    const proposal = await this.proposalModel.findById(id).populate('createdBy', 'name email').populate('menuId', 'name');
    if (!proposal) throw new NotFoundException('Proposal not found');
    return proposal;
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
