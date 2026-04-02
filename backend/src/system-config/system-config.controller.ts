import { Controller, Get, Post, Body, UseGuards, UseInterceptors, UploadedFile, Request, Patch } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { SystemConfigService } from './system-config.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { SecureDeviceGuard } from '../common/guards/secure-device.guard';

@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get()
  findPublic() {
    return this.systemConfigService.findPublic();
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard, SecureDeviceGuard)
  @Roles(Role.VORSTAND)
  findAll() {
    return this.systemConfigService.findAll();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard, SecureDeviceGuard)
  @Roles(Role.VORSTAND)
  updateMany(@Body() updates: Record<string, string>, @Request() req: any) {
    return this.systemConfigService.updateMany(updates, req.user.userId);
  }

  @Post('logo')
  @UseGuards(JwtAuthGuard, RolesGuard, SecureDeviceGuard)
  @Roles(Role.VORSTAND)
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads/brand',
      filename: (req, file, cb) => {
        const ext = file.originalname.split('.').pop();
        cb(null, `logo.${ext}`);
      }
    })
  }))
  async uploadLogo(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
    const imageUrl = `/uploads/brand/${file.filename}`;
    await this.systemConfigService.updateLogo(imageUrl, req.user.userId);
    return { imageUrl };
  }

  @Post('test-email')
  @UseGuards(JwtAuthGuard, RolesGuard, SecureDeviceGuard)
  @Roles(Role.VORSTAND)
  async sendTestEmail(@Request() req: any) {
    return this.systemConfigService.sendTestEmail(req.user.userId);
  }
}
