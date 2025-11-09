import { createHash, randomBytes } from 'node:crypto';

export function generateSecureToken(bytes = 48): string {
  return randomBytes(bytes).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
