import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ActivateDeviceDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsString()
  @IsOptional()
  name?: string;
}
