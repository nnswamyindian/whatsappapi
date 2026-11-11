import crypto from 'node:crypto';
import { ENV } from '../config/env.js';
// Derive 32-byte key from ENCRYPTION_KEY or JWT_SECRET
function getEncryptionKey() {
    const secretSource = process.env.ENCRYPTION_KEY || ENV.JWT_SECRET;
    return crypto.createHash('sha256').update(secretSource).digest();
}
/**
 * Encrypt a secret string using AES-256-GCM.
 * Output format: "enc:v1:<iv_hex>:<auth_tag_hex>:<cipher_hex>"
 */
export function encryptSecret(plainText) {
    if (!plainText)
        return '';
    // If already encrypted with our format, return as is
    if (plainText.startsWith('enc:v1:'))
        return plainText;
    const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `enc:v1:${iv.toString('hex')}:${authTag}:${encrypted}`;
}
/**
 * Decrypt an AES-256-GCM encrypted secret.
 * If the string does not match the encrypted envelope format,
 * returns plain text for backwards compatibility.
 */
export function decryptSecret(cipherText) {
    if (!cipherText)
        return '';
    if (!cipherText.startsWith('enc:v1:')) {
        // Unencrypted legacy fallback
        return cipherText;
    }
    try {
        const parts = cipherText.split(':');
        if (parts.length !== 5)
            return cipherText;
        const ivHex = parts[2];
        const authTagHex = parts[3];
        const encryptedHex = parts[4];
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (err) {
        console.error('[Decryption Error]: Failed to decrypt stored credential', err);
        return '';
    }
}
/**
 * Masks a sensitive token for UI or logging display (e.g. "EAA...9xZ1").
 */
export function maskSecret(secret) {
    if (!secret)
        return '';
    const plain = decryptSecret(secret);
    if (plain.length <= 8)
        return '••••••••';
    return `${plain.substring(0, 4)}••••••••${plain.substring(plain.length - 4)}`;
}
