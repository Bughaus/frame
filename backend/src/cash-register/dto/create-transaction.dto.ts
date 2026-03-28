import { IsString, IsArray, ValidateNested, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class TransactionItemDto {
  @IsString()
  articleId!: string;

  @IsNumber()
  quantity!: number;
}

export class CreateTransactionDto {
  @IsString()
  accountId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionItemDto)
  items!: TransactionItemDto[];

  @IsOptional()
  @IsString()
  description?: string;
}
