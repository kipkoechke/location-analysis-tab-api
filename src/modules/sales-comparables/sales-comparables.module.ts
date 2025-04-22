import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PdfExtractorController } from './sales-comparables.controller';
import { PdfExtractorService } from './sales-comparables.service';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [PdfExtractorController],
  providers: [PdfExtractorService],
  exports: [PdfExtractorService],
})
export class PdfExtractorModule {}
