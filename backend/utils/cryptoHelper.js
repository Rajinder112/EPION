const crypto = require('crypto');

// Safe key derivation (must be exactly 32 bytes for AES-256)
const getEncryptionKey = () => {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'sgpgi_nursing_prep_default_enc_secret';
  return crypto.createHash('sha256').update(secret).digest();
};

/**
 * Encrypts plaintext using AES-256-GCM.
 * @param {string} text - The plaintext to encrypt.
 * @returns {string} The formatted encrypted string, or the input if already encrypted.
 */
const encrypt = (text) => {
  if (text === null || text === undefined) return text;
  const str = String(text).trim();
  if (str.startsWith('enc:aes256gcm:')) return str; // Already encrypted

  try {
    const iv = crypto.randomBytes(12); // 96-bit IV standard for GCM
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(str, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag().toString('hex');
    return `enc:aes256gcm:${iv.toString('hex')}:${tag}:${encrypted}`;
  } catch (err) {
    console.error('Encryption error:', err.message);
    return str; // Fallback to raw value on error to prevent data loss
  }
};

/**
 * Decrypts an AES-256-GCM encrypted string.
 * @param {string} encryptedText - The encrypted string format.
 * @returns {string} The decrypted plaintext, or the input if not encrypted.
 */
const decrypt = (encryptedText) => {
  if (encryptedText === null || encryptedText === undefined) return encryptedText;
  const str = String(encryptedText).trim();
  if (!str.startsWith('enc:aes256gcm:')) return str; // Plaintext (not encrypted)

  try {
    const parts = str.split(':');
    if (parts.length !== 5) return str; // Invalid format

    const iv = Buffer.from(parts[2], 'hex');
    const tag = Buffer.from(parts[3], 'hex');
    const ciphertext = parts[4];
    const key = getEncryptionKey();

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err.message);
    return str; // Return input on error to prevent total data loss
  }
};

module.exports = {
  encrypt,
  decrypt
};
