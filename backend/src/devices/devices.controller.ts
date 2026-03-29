import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { SecureDeviceGuard } from '../common/guards/secure-device.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ActivateDeviceDto } from './dto/activate-device.dto';
import { HardwareManagement } from '../common/decorators/hardware-management.decorator';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get('status')
  async getStatus() {
    const count = await this.devicesService.countActiveDevices();
    return { 
      hasActiveDevices: count > 0,
      bootstrapMode: count === 0
    };
  }

  @Post('activate')
  activate(@Body() dto: ActivateDeviceDto) {
    return this.devicesService.activateDevice(dto);
  }

  @HardwareManagement()
  @UseGuards(JwtAuthGuard, RolesGuard, SecureDeviceGuard)
  @Roles('VORSTAND')
  @Post('activation-code')
  generateCode(@Request() req: any) {
    return this.devicesService.generateActivationCode(req.user.sub || req.user.userId);
  }

  @HardwareManagement()
  @UseGuards(JwtAuthGuard, RolesGuard, SecureDeviceGuard)
  @Roles('VORSTAND')
  @Get()
  findAll() {
    return this.devicesService.listDevices();
  }

  @HardwareManagement()
  @UseGuards(JwtAuthGuard, RolesGuard, SecureDeviceGuard)
  @Roles('VORSTAND')
  @Post(':id/revoke')
  revoke(@Param('id') id: string) {
    return this.devicesService.revokeDevice(id);
  }

  @HardwareManagement()
  @UseGuards(JwtAuthGuard, RolesGuard, SecureDeviceGuard)
  @Roles('VORSTAND')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.devicesService.deleteDevice(id);
  }
}
