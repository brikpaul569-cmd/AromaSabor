import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

  async update(id: string, data: Record<string, any>) {
    const proposal = await this.proposalModel.findById(id);
    if (!proposal) throw new NotFoundException('Proposal not found');

    // Block editing of terminal or expired proposals
    if (proposal.status === 'expirado') {
      throw new ConflictException('This proposal has expired and cannot be modified');
    }
    if (['aceptado', 'rechazado'].includes(proposal.status)) {
      throw new ConflictException(`Cannot modify a proposal with status "${proposal.status}"`);
    }
    // Auto-expire if past due
    if (proposal.status === 'enviado' && proposal.expiresAt < new Date()) {
      proposal.status = 'expirado';
      return proposal.save();
    }

    const previousItems = [...proposal.items] as ProposalItem[];
    const reason = typeof data.reason === 'string' ? data.reason : undefined;

    // Only allow specific fields — no Object.assign with untrusted keys
    if (data.items !== undefined) {
      proposal.items = data.items as any;
    }
    if (data.guestCount !== undefined) {
      proposal.guestCount = data.guestCount;
    }
    if (data.notes !== undefined) {
      proposal.notes = data.notes;
    }

    if (data.items) {
      const pricing = this.recalculate(proposal);
      proposal.pricePerPlate = pricing.pricePerPlate;
      proposal.quotation = pricing.quotation;
      proposal.totalPrice = pricing.quotation;
      // Transition state when chef edits an active proposal
      if (['enviado', 'modificado_por_cliente'].includes(proposal.status)) {
        assertValidTransition(proposal.status, 'modificado_por_chef');
        proposal.status = 'modificado_por_chef';
      }
    }
    return this.saveWithHistory(proposal, 'chef', previousItems, reason);
  }

  async updateByToken(
    token: string,
    updateData: { items: ProposalItem[]; guestCount?: number; reason?: string },
  ) {
    const proposal = await this.proposalModel.findOne({ token }).populate('menuId');
    if (!proposal) throw new NotFoundException('Proposal not found');
    if (proposal.status === 'expirado') {
      throw new ConflictException('This proposal has expired and cannot be modified');
    }
    if (['aceptado', 'rechazado'].includes(proposal.status)) {
      throw new ConflictException(`Cannot modify a proposal with status "${proposal.status}"`);
    }
    if (!['enviado', 'modificado_por_chef'].includes(proposal.status)) {
      throw new ConflictException(`Cannot modify proposal in status "${proposal.status}"`);
    }

    const previousItems = [...proposal.items] as ProposalItem[];

    // Validate all items belong to the menu and prices match
    if (updateData.items) {
      if (!proposal.menuId) {
        throw new BadRequestException('Cannot validate items: proposal has no menu');
      }
      const menu: any = proposal.menuId;
      const menuItemMap = new Map<string, { pricePerPortion: number }>();
      for (const cat of menu.categories) {
        for (const menuItem of cat.items) {
          menuItemMap.set(menuItem._id.toString(), { pricePerPortion: menuItem.pricePerPortion });
        }
      }
      for (const item of updateData.items) {
        const itemId = (item as any)._id;
        const stored = menuItemMap.get(itemId);
        if (!stored) {
          throw new BadRequestException(`Item "${item.name}" does not belong to this menu`);
        }
        if ((item as any).pricePerPortion !== stored.pricePerPortion) {
          throw new BadRequestException(
            `Price mismatch for "${item.name}": cannot override menu price of $${stored.pricePerPortion}`,
          );
        }
      }
    }

    proposal.items = updateData.items as any;

    if (updateData.guestCount !== undefined) {
      proposal.guestCount = updateData.guestCount;
    }

    // Recalculate pricing
    const pricing = this.recalculate(proposal);
    proposal.pricePerPlate = pricing.pricePerPlate;
    proposal.quotation = pricing.quotation;
    proposal.totalPrice = pricing.quotation;

    // Transition state
    assertValidTransition(proposal.status, 'modificado_por_cliente');
    proposal.status = 'modificado_por_cliente';

    return this.saveWithHistory(proposal, 'cliente', previousItems, updateData.reason);
  }

  async remove(id: string) {
    const proposal = await this.proposalModel.findByIdAndDelete(id);
    if (!proposal) throw new NotFoundException('Proposal not found');
    return proposal;
  }
}
