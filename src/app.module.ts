import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/db.module';
import { PdfController } from './modules/pdf/pdf.controller';
import { PropertyModule } from './modules/properties/properties.module';
import { PdfExtractorModule } from './modules/sales-comparables/sales-comparables.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    PropertyModule,
    PdfExtractorModule,
  ],
  controllers: [AppController, PdfController],
  providers: [AppService],
})
export class AppModule {}
