import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/db.module';
import { PdfExtractorModule } from './modules/sales-comparables/sales-comparables.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    PdfExtractorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
