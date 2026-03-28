import { IsString, IsArray, ValidateNested, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionItemDto } from './create-transaction.dto';
import { GuestPaymentMethod } from '@prisma/client';

export class CreateGuestTransactionDto {
  @IsString()
  slotId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionItemDto)
  items!: TransactionItemDto[];

  @IsEnum(GuestPaymentMethod)
  paymentMethod!: GuestPaymentMethod;

  @IsOptional()
  @IsString()
  paypalReference?: string;
}
