import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsDateString } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  date: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  maxSlots?: number;

  @IsNumber()
  @Min(0)
  hoursValue: number;

  @IsString()
  @IsOptional()
  location?: string;
}
