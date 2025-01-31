import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
// import {TypeOrmModule} from '@nestjs/typeorm';
import { TypeOrmModule } from '@nestjs/typeorm'
import { DatabaseModule } from './database/database.module';
import { MetricCsvService } from './services/metric-csv/metric-csv.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { UpdatedDateService } from './services/updated-date/updated-date.service';
import {
  KeycloakConnectModule,
  AuthGuard,
} from 'nest-keycloak-connect';
import { APP_GUARD } from '@nestjs/core';
import { HttpModule, HttpService } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';

@Module({

  controllers: [AppController],
  providers: [AppService,
    // {
    //   provide: APP_GUARD,
    //   useClass: AuthGuard,
    // },
    MetricCsvService, UpdatedDateService],
  imports: [
    DatabaseModule, HttpModule,
    CacheModule.register({
      max: 100 * 1000 * 1000, //100MB
      ttl: 1000 * 60 * 60 * 24, // 1 week(in ms)
      isGlobal: true,
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get<number>('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [],
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'src/maps'),
      renderPath: new RegExp('^/assets')
    }),
    KeycloakConnectModule.register({
      authServerUrl: process.env.KEY_CLOCK_URL,
      realm: process.env.REALM,
      clientId: process.env.KEY_CLOAK_CLIENT_ID,
      secret: process.env.KEY_CLOAK_SECRET,
    }),

  ],

})
export class AppModule {

}