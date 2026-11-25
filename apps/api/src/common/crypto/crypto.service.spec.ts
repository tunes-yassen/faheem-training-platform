import { ConfigService } from '@nestjs/config';
import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  const config = { get: () => 'test-secret-key-32-chars-minimum' } as unknown as ConfigService;
  const service = new CryptoService(config);

  it('encrypts and decrypts secrets with AES-256-GCM', () => {
    const plain = 'sk_live_faheem_992837465';
    const enc = service.encrypt(plain);
    expect(enc.startsWith('enc:v1:')).toBe(true);
    expect(enc).not.toContain(plain);
    expect(service.decrypt(enc)).toBe(plain);
  });

  it('masks secrets while preserving only last 4 chars', () => {
    const plain = 'sk_live_faheem_992837465';
    const enc = service.encrypt(plain);
    const masked = service.maskSecret(enc);
    expect(masked.endsWith('7465')).toBe(true);
    expect(masked).not.toContain('sk_live');
    expect(masked.startsWith('****')).toBe(true);
  });

  it('verifies valid HMAC-SHA256 signatures and rejects tampered ones', () => {
    const payload = 'evt1:pay1:ref1:CAPTURED:500';
    const secret = 'webhook-secret';
    const sig = service.hmacSha256(payload, secret);
    expect(service.verifyHmacSha256(payload, sig, secret)).toBe(true);
    expect(service.verifyHmacSha256(payload, 'invalid', secret)).toBe(false);
    expect(service.verifyHmacSha256(`${payload}x`, sig, secret)).toBe(false);
  });
});
