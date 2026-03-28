import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsDateString, IsUUID } from 'class-validator';

export class CreateEntryDto {
  @IsUUID()
  @IsOptional()
  eventId?: string;

  @IsDateString()
  date: string;

  @IsNumber()
  @Min(0)
  hours: number;

  @IsString()
  @IsOptional()
  description?: string;
  
  @IsNumber()
  year: number;
}
