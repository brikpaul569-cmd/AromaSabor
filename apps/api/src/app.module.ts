import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth/auth.module';
import { ClientAuthModule } from './modules/client-auth/client-auth.module';
import { MenusModule } from './modules/menus/menus.module';
import { ProposalsModule } from './modules/proposals/proposals.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../.env'] }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI', 'mongodb://localhost:27017/aromasabor'),
      }),
    }),
    AuthModule,
    ClientAuthModule,
    MenusModule,
    ProposalsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
