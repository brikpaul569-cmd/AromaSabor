import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Proposal, ProposalItem, ProposalDocument } from '../../schemas/proposal.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { calculateQuotation } from '@aromasabor/utils';
import { assertValidTransition } from './proposals.state-machine';

@Injectable()
export class ProposalsService {
  constructor(
    @InjectModel(Proposal.name) private proposalModel: Model<Proposal>,
    private notificationsService: NotificationsService,
  ) {}

  private recalculate(proposal: Proposal): { pricePerPlate: number; quotation: number } {
    const pricePerPlate = proposal.items.reduce((sum, i) => sum + i.pricePerPortion, 0);
    const q = calculateQuotation(
      proposal.items.map((i) => ({ price: i.pricePerPortion, quantity: proposal.guestCount })),
    );
    return { pricePerPlate, quotation: q.total };
  }

  private async saveWithHistory(
    proposal: ProposalDocument,
    modifiedBy: 'chef' | 'cliente',
    previousItems?: ProposalItem[],
    reason?: string,
  ) {
    proposal.lastModifiedBy = modifiedBy;
    proposal.lastModifiedAt = new Date();
    if (previousItems) {
      proposal.editHistory = proposal.editHistory || [];
      proposal.editHistory.push({
        modifiedBy,
        modifiedAt: new Date(),
        note: reason || `${modifiedBy === 'chef' ? 'Chef' : 'Client'} modified the proposal`,
        previousItems,
        newItems: [...proposal.items],
        reason,
      } as any);
    }
    await this.notificationsService.create({
      proposalId: proposal._id,
      type: 'proposal_updated',
      message: `Proposal for ${proposal.clientName} is now "${proposal.status}"`,
    });
    return proposal.save();
  }

  async create(dto: CreateProposalDto, userId: string) {
    const { pricePerPlate, quotation } = this.recalculate({
      items: dto.items as ProposalItem[],
      guestCount: dto.guestCount,
    } as Proposal);

    const proposal = new this.proposalModel({
      menuId: new Types.ObjectId(dto.menuId),
      token: uuidv4(),
      clientName: dto.clientName,
      eventDate: dto.eventDate,
      guestCount: dto.guestCount,
      items: dto.items,
      notes: dto.notes ?? '',
      status: 'borrador',
      quotation,
      pricePerPlate,
      totalPrice: quotation,
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
    const previousItems = [...proposal.items] as ProposalItem[];
    proposal.status = 'enviado';
    proposal.expiresAt = new Date(Date.now() + 20 * 60 * 1000);
    return this.saveWithHistory(proposal, 'chef', previousItems, 'Sent to client');
  }

  async approve(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid proposal ID');
    const proposal = await this.proposalModel.findById(id);
    if (!proposal) throw new NotFoundException('Proposal not found');
    assertValidTransition(proposal.status, 'aceptado');
    const previousItems = [...proposal.items] as ProposalItem[];
    proposal.status = 'aceptado';
    return this.saveWithHistory(proposal, 'cliente', previousItems, 'Proposal approved');
  }

  async reject(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid proposal ID');
    const proposal = await this.proposalModel.findById(id);
    if (!proposal) throw new NotFoundException('Proposal not found');
    assertValidTransition(proposal.status, 'rechazado');
    const previousItems = [...proposal.items] as ProposalItem[];
    proposal.status = 'rechazado';
    return this.saveWithHistory(proposal, 'cliente', previousItems, 'Proposal rejected');
  }

  async transitionStatus(id: string, toStatus: string, modifiedBy: 'chef' | 'cliente', reason?: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid proposal ID');
    const proposal = await this.proposalModel.findById(id);
    if (!proposal) throw new NotFoundException('Proposal not found');
    assertValidTransition(proposal.status, toStatus);
    const previousItems = [...proposal.items] as ProposalItem[];
    proposal.status = toStatus;
    return this.saveWithHistory(proposal, modifiedBy, previousItems, reason);
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid proposal ID');
    const proposal = await this.proposalModel.findById(id).populate('createdBy', 'name email').populate('menuId', 'name');
    if (!proposal) throw new NotFoundException('Proposal not found');
    return proposal;
  }

  async getHistory(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid proposal ID');
    const proposal = await this.proposalModel.findById(id).select('editHistory status clientName');
    if (!proposal) throw new NotFoundException('Proposal not found');
    return proposal.editHistory || [];
  }

  async update(id: string, data: Partial<Proposal> & { reason?: string }) {
    const proposal = await this.proposalModel.findById(id);
    if (!proposal) throw new NotFoundException('Proposal not found');
    const previousItems = [...proposal.items] as ProposalItem[];
    const { reason, ...fields } = data;
    Object.assign(proposal, fields);
    if (fields.items) {
      const pricing = this.recalculate(proposal);
      proposal.pricePerPlate = pricing.pricePerPlate;
      proposal.quotation = pricing.quotation;
      proposal.totalPrice = pricing.quotation;
    }
    return this.saveWithHistory(proposal, 'chef', previousItems, reason);
  }

  async remove(id: string) {
    const proposal = await this.proposalModel.findByIdAndDelete(id);
    if (!proposal) throw new NotFoundException('Proposal not found');
    return proposal;
  }
}
