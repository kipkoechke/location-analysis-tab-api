import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import * as path from 'path';
import { PdfExtractorService } from './sales-comparables.service';

@Controller('pdf-extractor')
export class PdfExtractorController {
  constructor(private readonly pdfExtractorService: PdfExtractorService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          // Generate unique filename
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Accept only PDFs
        if (file.mimetype !== 'application/pdf') {
          return cb(new Error('Only PDF files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadPdf(@UploadedFile() file: Express.Multer.File) {
    try {
      // Make sure uploads directory exists
      if (!fs.existsSync('./uploads')) {
        fs.mkdirSync('./uploads');
      }

      // Extract data from the uploaded PDF
      const result = await this.pdfExtractorService.extractSalesComparables(
        file.path,
      );

      // Clean up - remove the uploaded file after processing
      fs.unlinkSync(file.path);

      return result;
    } catch (error) {
      throw new Error(`Failed to process PDF: ${error.message}`);
    }
  }
}
