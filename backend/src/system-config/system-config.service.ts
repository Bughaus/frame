import { Injectable, InternalServerErrorException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class SystemConfigService {
  private readonly logger = new Logger(SystemConfigService.name);

  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.systemConfig.findMany();
  }

  async findPublic() {
    const publicKeys = ['CLUB_NAME', 'CLUB_LOGO_URL', 'CLUB_WEBSITE_DISCLAIMER', 'AUTH_RFID_ENABLED', 'CLUB_EMAIL', 'CLUB_VORSTAND_NAMES'];
    return this.prisma.systemConfig.findMany({
      where: {
        key: { in: publicKeys }
      }
    });
  }

  async getMap() {
    const configs = await this.prisma.systemConfig.findMany();
    return configs.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);
  }

  async updateMany(updates: Record<string, string>, userId: string) {
    return this.prisma.$transaction(
      Object.entries(updates).map(([key, value]) =>
        this.prisma.systemConfig.upsert({
          where: { key },
          update: { value, updatedBy: userId },
          create: { key, value, updatedBy: userId, label: key, group: 'GENERAL' }
        })
      )
    );
  }

  async updateLogo(imageUrl: string, userId: string) {
    return this.prisma.systemConfig.upsert({
      where: { key: 'CLUB_LOGO_URL' },
      update: { value: imageUrl, updatedBy: userId },
      create: { key: 'CLUB_LOGO_URL', value: imageUrl, updatedBy: userId, label: 'Club Logo URL', group: 'GENERAL' }
    });
  }

  async sendTestEmail(userId: string) {
    const config = await this.getMap();
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { member: true }
    });

    if (!user) throw new BadRequestException('USER_NOT_FOUND');
    
    // Prioritize user's email from member record, fallback to username IF it looks like an email
    const recipient = user.member?.email || (user.username?.includes('@') ? user.username : null);

    if (!recipient) {
      throw new BadRequestException('NO_USER_EMAIL');
    }
    
    const transporter = nodemailer.createTransport({
      host: config['MAIL_SMTP_HOST'],
      port: parseInt(config['MAIL_SMTP_PORT'] || '587'),
      secure: config['MAIL_SMTP_SECURE'] === 'true',
      auth: {
        user: config['MAIL_SMTP_USER'],
        pass: config['MAIL_SMTP_PASS'],
      },
    });

    try {
      await transporter.sendMail({
        from: `"${config['MAIL_FROM_NAME'] || 'FRAME'}" <${config['MAIL_FROM_ADDRESS']}>`,
        to: recipient,
        subject: '💡 FRAME: Test Email',
        text: `Dies ist eine Test-Email von deiner FRAME Installation für den ${config['CLUB_NAME']}. Wenn du das hier liest, ist alles korrekt konfiguriert!`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2e7d32;">💡 FRAME Test-Email</h2>
            <p>Hallo <strong>${user.member?.firstName || user.username}</strong>,</p>
            <p>Dies ist eine Test-Email von deiner FRAME Installation für den <strong>${config['CLUB_NAME'] || 'Club'}</strong>.</p>
            <p>Wenn du diese Nachricht erhalten hast, sind deine SMTP-Einstellungen korrekt konfiguriert!</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 0.8rem; color: #888;">System: FRAME Management System</p>
          </div>
        `,
      });
      return { success: true, recipient };
    } catch (error: any) {
      this.logger.error('Failed to send test email', error);
      throw new InternalServerErrorException(error.message);
    }
  }
}
