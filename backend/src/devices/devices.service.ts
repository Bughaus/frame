import { Injectable, UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import { ActivateDeviceDto } from './dto/activate-device.dto';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async generateActivationCode(userId: string) {
    // Generate 6-char random code (UPPERCASE alphanumeric)
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    return this.prisma.deviceActivationCode.create({
      data: {
        code,
        expiresAt,
        createdBy: userId,
      },
    });
  }

  async activateDevice(dto: ActivateDeviceDto) {
    const activation = await this.prisma.deviceActivationCode.findUnique({
      where: { code: dto.code },
    });

    if (!activation || activation.usedAt || activation.expiresAt < new Date()) {
      throw new UnauthorizedException('Ungültiger oder abgelaufener Aktivierungscode.');
    }

    // Generate a long-lived random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Create or update SecureDevice
    const device = await this.prisma.secureDevice.upsert({
      where: { deviceId: dto.deviceId },
      create: {
        deviceId: dto.deviceId,
        name: dto.name || 'Unbenanntes Club-Gerät',
        tokenHash,
        isActive: true,
      },
      update: {
        name: dto.name || undefined,
        tokenHash,
        isActive: true,
        lastUsedAt: new Date(),
      },
    });

    // Mark code as used
    await this.prisma.deviceActivationCode.update({
      where: { id: activation.id },
      data: { usedAt: new Date() },
    });

    return {
      token: rawToken,
      deviceName: device.name,
    };
  }

  async validateDeviceToken(token: string) {
    if (!token) return false;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const device = await this.prisma.secureDevice.findUnique({
      where: { tokenHash },
    });

    if (device && device.isActive) {
      // Update lastUsedAt asynchronously (no await) or synchronously? 
      // Synchronously to be safe for now
      await this.prisma.secureDevice.update({
        where: { id: device.id },
        data: { lastUsedAt: new Date() },
      });
      return true;
    }
    return false;
  }

  async listDevices() {
    return this.prisma.secureDevice.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeDevice(id: string) {
    return this.prisma.secureDevice.update({
      where: { id },
      data: { isActive: false, tokenHash: null },
    });
  }

  async deleteDevice(id: string) {
    return this.prisma.secureDevice.delete({
      where: { id },
    });
  }

  async countActiveDevices() {
    return this.prisma.secureDevice.count({
      where: { isActive: true },
    });
  }
}
