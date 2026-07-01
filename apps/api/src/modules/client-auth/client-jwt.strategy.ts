import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client } from '../../schemas/client.schema';

@Injectable()
export class ClientJwtStrategy extends PassportStrategy(Strategy, 'client-jwt') {
  constructor(
    @InjectModel(Client.name) private clientModel: Model<Client>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.access_token,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    if (payload.role !== 'client') {
      throw new UnauthorizedException('Invalid token');
    }
    const client = await this.clientModel.findById(payload.sub).select('-passwordHash');
    if (!client) {
      throw new UnauthorizedException('Client not found');
    }
    return client;
  }
}
