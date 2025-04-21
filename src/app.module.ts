import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/db.module';
import { PropertiesModule } from './modules/properties/properties.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, PropertiesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
