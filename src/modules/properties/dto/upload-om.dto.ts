import { IsNumber } from 'class-validator';

export class UploadOMDto {
  @IsNumber()
  propertyId: number;
}
