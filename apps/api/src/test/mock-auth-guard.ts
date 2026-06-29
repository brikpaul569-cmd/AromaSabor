import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class MockJwtAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    req.user = { _id: new Types.ObjectId('000000000000000000000001'), email: 'admin@test.com' };
    return true;
  }
}
