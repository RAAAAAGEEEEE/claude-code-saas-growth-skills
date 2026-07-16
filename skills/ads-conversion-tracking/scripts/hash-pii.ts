/**
 * Normalise et hashe (SHA-256) une donnée personnelle avant transmission à une
 * conversion API publicitaire, conformément aux attentes des plateformes
 * (ex: Meta Conversions API, Google Enhanced Conversions).
 *
 * Ne fait aucun appel réseau : fonction pure locale.
 */

import { createHash } from 'node:crypto';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function hashEmail(email: string): string {
  return sha256Hex(normalizeEmail(email));
}

export function hashPhone(phone: string): string {
  return sha256Hex(normalizePhone(phone));
}
