import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);
const KEYLEN = 64;

/** Returns a `salt:hash` string suitable for storing in the DB. */
export async function hashPassword(plain: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const hash = (await scryptAsync(plain, salt, KEYLEN)) as Buffer;
    return `${salt}:${hash.toString('hex')}`;
}

/** Returns true if `plain` matches the stored `salt:hash` string. */
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
    const colonIdx = stored.indexOf(':');
    if (colonIdx === -1) return false;
    const salt    = stored.slice(0, colonIdx);
    const hashHex = stored.slice(colonIdx + 1);
    if (!salt || !hashHex) return false;

    const hash       = (await scryptAsync(plain, salt, KEYLEN)) as Buffer;
    const storedHash = Buffer.from(hashHex, 'hex');
    if (hash.length !== storedHash.length) return false;
    return timingSafeEqual(hash, storedHash);
}
