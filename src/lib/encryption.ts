import crypto from 'crypto';

// Clave de encriptación desde variables de entorno
// Esta clave debe ser de 32 bytes (256 bits) para AES-256
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

// Función para obtener la clave de encriptación en formato Buffer
function getEncryptionKey(): Buffer {
  // Si la clave viene como hex string, convertirla a Buffer
  if (ENCRYPTION_KEY.length === 64) {
    return Buffer.from(ENCRYPTION_KEY, 'hex');
  }
  // Si no, usar el hash SHA-256 de la clave para asegurar 32 bytes
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

/**
 * Encripta un texto usando AES-256-GCM
 * @param text - Texto a encriptar
 * @returns String en formato base64 que incluye el IV, el tag de autenticación y el texto encriptado
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16); // IV de 16 bytes para GCM
    
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    // Combinar IV + authTag + texto encriptado en formato: IV:authTag:encrypted
    const result = `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
    
    return result;
  } catch (error) {
    console.error('Error al encriptar:', error);
    throw new Error('Error al encriptar el texto');
  }
}

/**
 * Desencripta un texto usando AES-256-GCM
 * @param encryptedText - Texto encriptado en formato base64 (IV:authTag:encrypted)
 * @returns Texto desencriptado
 */
export function decrypt(encryptedText: string): string {
  try {
    const key = getEncryptionKey();
    const parts = encryptedText.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Formato de texto encriptado inválido');
    }
    
    const [ivBase64, authTagBase64, encrypted] = parts;
    
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Error al desencriptar:', error);
    throw new Error('Error al desencriptar el texto');
  }
}
