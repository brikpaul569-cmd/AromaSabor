import { Controller, Post, Get, Body, Res, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { ClientAuthService } from './client-auth.service';
import { ClientGuard } from './client.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 24 * 60 * 60 * 1000,
  path: '/',
};

@Controller('auth/client')
export class ClientAuthController {
  constructor(
    private clientAuthService: ClientAuthService,
    private jwtService: JwtService,
  ) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.clientAuthService.create(dto);
    res.cookie('access_token', result.accessToken, COOKIE_OPTIONS);
    return { user: result.client };
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const client = await this.clientAuthService.validate(dto.email, dto.password);
    const payload = { sub: client._id, email: client.email, role: 'client' };
    const accessToken = this.jwtService.sign(payload);
    res.cookie('access_token', accessToken, COOKIE_OPTIONS);
    return { user: { _id: client._id, email: client.email, name: client.name } };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.cookie('access_token', '', { ...COOKIE_OPTIONS, maxAge: 0 });
    return { message: 'Logged out' };
  }

  @UseGuards(ClientGuard)
  @Get('me')
  async me(@CurrentUser() user: any) {
    return this.clientAuthService.findById(user._id);
  }
}
