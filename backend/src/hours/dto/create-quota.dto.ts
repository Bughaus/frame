import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class CreateQuotaDto {
  @IsNumber()
  year: number;

  @IsNumber()
  @Min(0)
  requiredHours: number;

  @IsString()
  @IsOptional()
  description?: string;
}
