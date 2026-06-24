import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Admin } from '../../schemas/admin.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
    private jwtService: JwtService,
  ) {}

  async register(email: string, name: string, password: string) {
    const existing = await this.adminModel.findOne({ email: email.toLowerCase() });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await this.adminModel.create({ email, name, passwordHash });

    const payload = { sub: admin._id, email: admin.email, role: admin.role };
    return {
      accessToken: this.jwtService.sign(payload),
      admin: { _id: admin._id, email: admin.email, name: admin.name },
    };
  }

  async validateAdmin(email: string, password: string) {
    const admin = await this.adminModel.findOne({ email: email.toLowerCase() });
    if (!admin) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    return admin;
  }

  async login(email: string, password: string) {
    const admin = await this.validateAdmin(email, password);
    const payload = { sub: admin._id, email: admin.email, role: admin.role };
    return {
      accessToken: this.jwtService.sign(payload),
      admin: { _id: admin._id, email: admin.email, name: admin.name },
    };
  }

  async getProfile(id: string) {
    const admin = await this.adminModel.findById(id).select('-passwordHash');
    if (!admin) throw new NotFoundException('Admin not found');
    return admin;
  }
}
