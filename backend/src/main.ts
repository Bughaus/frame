import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync } from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({ origin: '*' }); 
  app.setGlobalPrefix('api/v1');

  // Find the assets folder (could be in root if started from there, or in backend)
  let uploadsPath = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsPath)) {
    uploadsPath = join(process.cwd(), 'backend', 'uploads');
  }

  app.useStaticAssets(uploadsPath, { prefix: '/uploads' });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
