import crypto from 'crypto'

const SCRYPT_KEY_LENGTH = 64

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH)
  return `${salt}:${derivedKey.toString('hex')}`
}

export function verifyPassword(password: string, hash: string): boolean {
  const [salt, key] = hash.split(':')
  if (!salt || !key) return false
  const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH)
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), derivedKey)
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}
