import { INestApplication, Provider, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MenusModule } from '../modules/menus/menus.module';
import { ProposalsModule } from '../modules/proposals/proposals.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { Admin, AdminSchema } from '../schemas/admin.schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MockJwtAuthGuard } from './mock-auth-guard';

let mongod: MongoMemoryServer;

export async function createTestApp(overrides?: {
  imports?: any[];
  providers?: Provider[];
}): Promise<INestApplication> {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
      MongooseModule.forRootAsync({
        useFactory: (): MongooseModuleOptions => ({ uri }),
      }),
      MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }]),
      MenusModule,
      NotificationsModule,
      ProposalsModule,
      ...(overrides?.imports || []),
    ],
    providers: [...(overrides?.providers || [])],
  })
    .overrideGuard(JwtAuthGuard)
    .useClass(MockJwtAuthGuard)
    .compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return app;
}

export async function stopTestApp(app: INestApplication) {
  await app.close();
  if (mongod) await mongod.stop();
}
