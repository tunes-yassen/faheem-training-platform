import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor(private readonly config: ConfigService) {
    const rawKey =
      this.config.get<string>('SETTINGS_ENCRYPTION_KEY') ||
      'faheem-default-dev-key-change-in-production';
    this.key = crypto.createHash('sha256').update(rawKey).digest();
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `enc:v1:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(ciphertext: string): string {
    if (!ciphertext.startsWith('enc:v1:')) {
      return ciphertext;
    }
    const parts = ciphertext.split(':');
    if (parts.length !== 5) {
      throw new Error('Invalid encrypted payload format');
    }
    const iv = Buffer.from(parts[2], 'hex');
    const authTag = Buffer.from(parts[3], 'hex');
    const encrypted = Buffer.from(parts[4], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }

  maskSecret(value: string): string {
    if (!value) return '';
    const plain = value.startsWith('enc:v1:') ? this.decrypt(value) : value;
    if (plain.length <= 4) {
      return '****';
    }
    const tail = plain.slice(-4);
    return `${'*'.repeat(Math.min(12, Math.max(4, plain.length - 4)))}${tail}`;
  }

  sha256(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  hmacSha256(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  verifyHmacSha256(payload: string, signature: string, secret: string): boolean {
    if (!signature || !secret) return false;
    const expected = this.hmacSha256(payload, secret);
    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expected, 'utf8');
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  }

  randomNumericOtp(digits = 6): string {
    const max = Math.pow(10, digits);
    const min = Math.pow(10, digits - 1);
    return crypto.randomInt(min, max).toString();
  }

  randomCode(prefix: string, bytes = 6): string {
    return `${prefix}-${crypto.randomBytes(bytes).toString('hex').toUpperCase()}`;
  }
}
