import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Client } from '../../schemas/client.schema';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class ClientAuthService {
  constructor(
    @InjectModel(Client.name) private clientModel: Model<Client>,
    private jwtService: JwtService,
  ) {}

  async create(dto: RegisterDto) {
    const existing = await this.clientModel.findOne({ email: dto.email.toLowerCase() });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const client = await this.clientModel.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
    });

    const payload = { sub: client._id, email: client.email, role: 'client' };
    return {
      accessToken: this.jwtService.sign(payload),
      client: { _id: client._id, email: client.email, name: client.name },
    };
  }

  async validate(email: string, password: string) {
    const client = await this.clientModel.findOne({ email: email.toLowerCase() });
    if (!client) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, client.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    return client;
  }

  async findById(id: string) {
    const client = await this.clientModel.findById(id).select('-passwordHash');
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }
}
