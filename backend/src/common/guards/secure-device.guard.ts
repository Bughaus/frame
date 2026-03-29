import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DevicesService } from '../../devices/devices.service';
import { Role } from '@prisma/client';
import { IS_HARDWARE_MANAGEMENT_KEY } from '../decorators/hardware-management.decorator';

@Injectable()
export class SecureDeviceGuard implements CanActivate {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const deviceToken = request.headers['x-device-token'];

    // 1. Check if the current endpoint is Hardware Management
    const isHardwareManagement = this.reflector.getAllAndOverride<boolean>(
      IS_HARDWARE_MANAGEMENT_KEY,
      [context.getHandler(), context.getClass()]
    );

    // 2. Check if the system is in "Bootstrap Mode" (Zero active devices)
    const activeDeviceCount = await this.devicesService.countActiveDevices();
    
    if (activeDeviceCount === 0 && isHardwareManagement) {
      const user = request.user;
      // Allow VORSTAND to manage devices from any browser during bootstrap ONLY for management endpoints
      if (user && (user.roles?.includes(Role.VORSTAND) || user.roles?.includes('ADMIN'))) {
        return true;
      }
    }

    // 3. Strict Mode: Require a valid Device Token
    if (!deviceToken) {
      throw new ForbiddenException('Dieses Feature ist nur auf autorisierten Club-Geräten verfügbar.');
    }

    const isValid = await this.devicesService.validateDeviceToken(deviceToken);
    
    if (!isValid) {
      throw new ForbiddenException('Dieses Gerät ist nicht (mehr) für sensible Funktionen autorisiert.');
    }

    return true;
  }
}
