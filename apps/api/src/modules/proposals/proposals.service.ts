import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Proposal, ProposalItem, ProposalDocument } from '../../schemas/proposal.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { calculateQuotation } from '@aromasabor/utils';
import { assertValidTransition } from './proposals.state-machine';
import { generateBase58 } from '../../utils/base58';

interface MenuCategoryItem {
  _id?: any;
  name: string;
  description?: string;
  pricePerPortion: number;
  portionGrams?: number;
  unit?: string;
}

interface MenuCategory {
  _id?: any;
  id: string;
  label: string;
  maxItems: number;
  items: MenuCategoryItem[];
}

interface MenuDocument {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  categories: MenuCategory[];
  createdBy: Types.ObjectId;
}

@Injectable()
export class ProposalsService {
  constructor(
    @InjectModel(Proposal.name) private proposalModel: Model<Proposal>,
    private notificationsService: NotificationsService,
  ) {}

  async generateShortCode(): Promise<string> {
    const MAX_ATTEMPTS = 10;
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const code = generateBase58();
      const exists = await this.proposalModel.findOne({ shortCode: code }, { _id: 1 });
      if (!exists) return code;
    }
    throw new ConflictException('Failed to generate unique short code after multiple attempts');
  }

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
    return proposal.save();
  }

  async submitFromMenu(
    menu: MenuDocument,
    selectedItems: { _id: string; categoryId: string }[],
    guestCount: number,
    clientName?: string,
    notes?: string,
  ) {
    // Build proposal items by looking up each selected item in the menu
    const proposalItems: ProposalItem[] = [];

    for (const sel of selectedItems) {
      const cat = menu.categories.find((c) => c._id?.toString() === sel.categoryId || c.id === sel.categoryId);
      if (!cat) throw new BadRequestException(`Category ${sel.categoryId} not found in menu`);

      const menuItem = cat.items.find((i) => i._id?.toString() === sel._id);
      if (!menuItem) throw new BadRequestException(`Item ${sel._id} not found in category ${cat.label}`);

      // Check if this category already has the maximum allowed items
      const currentCount = proposalItems.filter((pi) => pi.categoryId === (cat._id?.toString() || cat.id)).length;
      if (currentCount >= cat.maxItems) {
        throw new BadRequestException(`Maximum ${cat.maxItems} item(s) allowed per category (${cat.label})`);
      }

      proposalItems.push({
        name: menuItem.name,
        description: menuItem.description || '',
        categoryId: cat._id?.toString() || cat.id,
        categoryLabel: cat.label,
        pricePerPortion: menuItem.pricePerPortion,
        portionGrams: menuItem.portionGrams,
        unit: menuItem.unit || 'gr',
        quantity: 1,
      });
    }

    // Calculate pricing
    const pricePerPlate = proposalItems.reduce((sum, i) => sum + i.pricePerPortion, 0);
    const q = calculateQuotation(
      proposalItems.map((i) => ({ price: i.pricePerPortion, quantity: guestCount })),
    );

    const proposal = new this.proposalModel({
      menuId: menu._id,
      token: uuidv4(),
      clientName: clientName || 'Client',
      eventDate: new Date().toISOString().split('T')[0],
      guestCount,
      items: proposalItems,
      notes: notes || '',
      status: 'enviado',
      quotation: q.total,
      pricePerPlate,
      totalPrice: q.total,
      expiresAt: new Date(Date.now() + 20 * 60 * 1000),
      createdBy: menu.createdBy,
    });

    const saved = await proposal.save();

    await this.notificationsService.create({
      proposalId: saved._id,
      type: 'proposal_created',
      message: `New plate submission from "${clientName || 'Client'}" for menu "${menu.name}"`,
    });

    return {
      token: saved.token,
      proposalId: saved._id,
      url: `/prop/${saved.token}`,
    };
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

  private assertNotExpired(proposal: ProposalDocument): void {
    if (proposal.status === 'expirado') {
      throw new BadRequestException('Esta propuesta ha vencido y no puede ser modificada');
    }
    if (
      ['enviado', 'modificado_por_cliente', 'modificado_por_chef'].includes(proposal.status) &&
      proposal.expiresAt < new Date()
    ) {
      throw new BadRequestException('Esta propuesta ha vencido y no puede ser modificada');
    }
  }

  async findByToken(token: string) {
    const proposal = await this.proposalModel.findOne({ token }).populate('menuId');
    if (!proposal) throw new NotFoundException('Proposal not found');
    if (!proposal.viewedAt) {
      proposal.viewedAt = new Date();
    }
    // Lazy shortCode generation — ensures existing proposals get a short code on first view
    if (!proposal.shortCode) {
      proposal.shortCode = await this.generateShortCode();
    }
    await proposal.save();
    return proposal;
  }

  async findByShortCode(shortCode: string) {
    const proposal = await this.proposalModel.findOne({ shortCode }).populate('menuId');
    if (!proposal) throw new NotFoundException('Proposal not found');
    if (!proposal.viewedAt) {
      proposal.viewedAt = new Date();
      await proposal.save();
    }
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
    const saved = await this.saveWithHistory(proposal, 'chef', previousItems, 'Sent to client');
    await this.notificationsService.create({
      proposalId: proposal._id,
      type: 'proposal_updated',
      message: `Propuesta para ${proposal.clientName} enviada al cliente`,
    });
    return saved;
  }

  async approve(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid proposal ID');
    const proposal = await this.proposalModel.findById(id);
    if (!proposal) throw new NotFoundException('Proposal not found');
    this.assertNotExpired(proposal);
    assertValidTransition(proposal.status, 'aceptado');
    const previousItems = [...proposal.items] as ProposalItem[];
    proposal.status = 'aceptado';
    proposal.expiresAt = new Date(); // expire the link so QR cannot be reused
    const saved = await this.saveWithHistory(proposal, 'cliente', previousItems, 'Proposal approved');
    await this.notificationsService.create({
      proposalId: proposal._id,
      type: 'proposal_accepted',
      message: `Propuesta para ${proposal.clientName} fue aceptada`,
    });
    return saved;
  }

  async reject(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid proposal ID');
    const proposal = await this.proposalModel.findById(id);
    if (!proposal) throw new NotFoundException('Proposal not found');
    this.assertNotExpired(proposal);
    assertValidTransition(proposal.status, 'rechazado');
    const previousItems = [...proposal.items] as ProposalItem[];
    proposal.status = 'rechazado';
    const saved = await this.saveWithHistory(proposal, 'cliente', previousItems, 'Proposal rejected');
    await this.notificationsService.create({
      proposalId: proposal._id,
      type: 'proposal_rejected',
      message: `Propuesta para ${proposal.clientName} fue rechazada`,
    });
    return saved;
  }

  async approveByToken(token: string) {
    const proposal = await this.proposalModel.findOne({ token });
    if (!proposal) throw new NotFoundException('Proposal not found');
    this.assertNotExpired(proposal);
    assertValidTransition(proposal.status, 'aceptado');
    const previousItems = [...proposal.items] as ProposalItem[];
    proposal.status = 'aceptado';
    proposal.expiresAt = new Date(); // expire the link so QR cannot be reused
    const saved = await this.saveWithHistory(proposal, 'cliente', previousItems, 'Proposal approved');
    await this.notificationsService.create({
      proposalId: proposal._id,
      type: 'proposal_accepted',
      message: `Propuesta para ${proposal.clientName} fue aceptada`,
    });
    return saved;
  }

  async rejectByToken(token: string) {
    const proposal = await this.proposalModel.findOne({ token });
    if (!proposal) throw new NotFoundException('Proposal not found');
    this.assertNotExpired(proposal);
    assertValidTransition(proposal.status, 'rechazado');
    const previousItems = [...proposal.items] as ProposalItem[];
    proposal.status = 'rechazado';
    const saved = await this.saveWithHistory(proposal, 'cliente', previousItems, 'Proposal rejected');
    await this.notificationsService.create({
      proposalId: proposal._id,
      type: 'proposal_rejected',
      message: `Propuesta para ${proposal.clientName} fue rechazada`,
    });
    return saved;
  }

  async submitItemResponse(token: string, items: { _id: string; itemStatus: string }[]) {
    const proposal = await this.proposalModel.findOne({ token });
    if (!proposal) throw new NotFoundException('Proposal not found');
    this.assertNotExpired(proposal);
    if (!['enviado', 'modificado_por_chef'].includes(proposal.status)) {
      throw new BadRequestException(
        `Cannot respond to proposal with status "${proposal.status}". Only "enviado" or "modificado_por_chef" proposals can be responded to.`,
      );
    }

    // Validate and update each item's status
    for (const response of items) {
      const item = (proposal.items as any[]).find((i) => i._id.toString() === response._id);
      if (!item) {
        throw new BadRequestException(`Item "${response._id}" not found in proposal`);
      }
      if (!['pendiente', 'aceptado', 'rechazado'].includes(response.itemStatus)) {
        throw new BadRequestException(`Invalid item status "${response.itemStatus}"`);
      }
      item.itemStatus = response.itemStatus;
    }

    // Transition to respuesta_parcial
    assertValidTransition(proposal.status, 'respuesta_parcial');
    proposal.status = 'respuesta_parcial';

    const saved = await this.saveWithHistory(proposal, 'cliente', [...proposal.items] as ProposalItem[], 'Client responded to items');

    await this.notificationsService.create({
      proposalId: proposal._id,
      type: 'proposal_client_responded',
      message: `El cliente respondió a los items de la propuesta para ${proposal.clientName}`,
    });

    return saved;
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
    const saved = await this.saveWithHistory(proposal, 'chef', previousItems, reason);
    if (data.items) {
      await this.notificationsService.create({
        proposalId: proposal._id,
        type: 'proposal_updated',
        message: `El chef modificó la propuesta para ${proposal.clientName}`,
      });
    }
    return saved;
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

    const saved = await this.saveWithHistory(proposal, 'cliente', previousItems, updateData.reason);
    await this.notificationsService.create({
      proposalId: proposal._id,
      type: 'proposal_updated',
      message: `El cliente modificó la propuesta para ${proposal.clientName}`,
    });
    return saved;
  }

  async claim(token: string, clientName: string) {
    const proposal = await this.proposalModel.findOne({ token });
    if (!proposal) throw new NotFoundException('Proposal not found');
    // Only allow claiming for proposals that have been sent
    if (proposal.status === 'borrador') {
      throw new BadRequestException('Cannot claim a draft proposal');
    }

    // Idempotent: only set claimedAt on first claim, but allow name update
    if (!proposal.claimedAt) {
      proposal.claimedAt = new Date();
    }
    proposal.claimedByClientName = clientName;

    return proposal.save();
  }

  async getTimeline(id: string): Promise<{ type: string; timestamp: string; label: string; description?: string }[]> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid proposal ID');
    const proposal = await this.proposalModel.findById(id);
    if (!proposal) throw new NotFoundException('Proposal not found');

    const doc = proposal as any;
    const events: { type: string; timestamp: string; label: string; description?: string }[] = [];

    // created — from createdAt
    events.push({
      type: 'created',
      timestamp: doc.createdAt?.toISOString?.() || doc.createdAt,
      label: 'Propuesta creada',
    });

    // sent — if proposal is not a draft
    if (proposal.status !== 'borrador') {
      const sentEntry = (proposal.editHistory || []).find(
        (e: any) => e.reason === 'Sent to client' || e.note === 'Sent to client',
      );
      events.push({
        type: 'sent',
        timestamp: sentEntry?.modifiedAt
          ? new Date(sentEntry.modifiedAt).toISOString()
          : (doc.updatedAt?.toISOString?.() || doc.updatedAt),
        label: 'Enviada al cliente',
      });
    }

    // claimed — from claimedAt
    if (proposal.claimedAt) {
      events.push({
        type: 'claimed',
        timestamp: new Date(proposal.claimedAt).toISOString(),
        label: 'Cliente identificado',
        description: proposal.claimedByClientName
          ? `Se identificó como ${proposal.claimedByClientName}`
          : undefined,
      });
    }

    // editHistory entries → chef_modified / client_modified
    if (proposal.editHistory) {
      for (const entry of proposal.editHistory) {
        const modifiedAt = new Date(entry.modifiedAt).toISOString();
        if (entry.modifiedBy === 'chef') {
          if (entry.reason === 'Sent to client') continue;
          events.push({
            type: 'chef_modified',
            timestamp: modifiedAt,
            label: 'Modificada por el chef',
            description: entry.note || entry.reason,
          });
        } else if (entry.modifiedBy === 'cliente') {
          if (entry.reason === 'Proposal approved' || entry.reason === 'Proposal rejected') continue;
          if (entry.reason === 'Client responded to items') {
            events.push({
              type: 'client_responded',
              timestamp: modifiedAt,
              label: 'Cliente respondió por ítem',
              description: entry.note,
            });
          } else {
            events.push({
              type: 'client_modified',
              timestamp: modifiedAt,
              label: 'Modificada por el cliente',
              description: entry.note || entry.reason,
            });
          }
        }
      }
    }

    // Terminal statuses
    if (proposal.status === 'aceptado') {
      const acceptEntry = [...(proposal.editHistory || [])]
        .reverse()
        .find((e: any) => e.reason === 'Proposal approved');
      events.push({
        type: 'accepted',
        timestamp: acceptEntry
          ? new Date(acceptEntry.modifiedAt).toISOString()
          : (doc.updatedAt?.toISOString?.() || doc.updatedAt),
        label: 'Aceptada',
      });
    }

    if (proposal.status === 'rechazado') {
      const rejectEntry = [...(proposal.editHistory || [])]
        .reverse()
        .find((e: any) => e.reason === 'Proposal rejected');
      events.push({
        type: 'rejected',
        timestamp: rejectEntry
          ? new Date(rejectEntry.modifiedAt).toISOString()
          : (doc.updatedAt?.toISOString?.() || doc.updatedAt),
        label: 'Rechazada',
      });
    }

    if (proposal.status === 'expirado') {
      events.push({
        type: 'expired',
        timestamp: proposal.expiresAt.toISOString(),
        label: 'Expirada',
      });
    }

    // Sort events chronologically by timestamp
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return events;
  }

  async remove(id: string) {
    const proposal = await this.proposalModel.findByIdAndDelete(id);
    if (!proposal) throw new NotFoundException('Proposal not found');
    return proposal;
  }
}
