import { PartialType } from '@nestjs/mapped-types';
import { CreateMemberDto } from './create-member.dto';
import { IsOptional, IsArray, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateMemberDto extends PartialType(CreateMemberDto) {
  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  roles?: Role[];
}
