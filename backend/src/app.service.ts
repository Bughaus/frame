import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getVersion(): string {
    try {
      const pkgPath = join(__dirname, '..', 'package.json');
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      return pkg.version || '0.0.1';
    } catch (e) {
      return '0.0.1';
    }
  }
}
