import crypto from 'crypto';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { ApiError } from '@/utils/ApiError';
import { StatusCodes } from 'http-status-codes';

class EncryptionService {
  private readonly algorithm: string = 'aes-256-gcm';
  private readonly keyLength: number = 32;
  private readonly ivLength: number = 16;
  private readonly saltLength: number = 64;
  private readonly tagLength: number = 16;
  private readonly iterations: number = 100000;
  private readonly digest: string = 'sha256';
  private readonly encoding: BufferEncoding = 'hex';

  /**
   * Encrypts sensitive data using AES-256-GCM
   */
  public async encrypt(data: string): Promise<string> {
    try {
      // Generate a random initialization vector
      const iv = crypto.randomBytes(this.ivLength);
      
      // Generate a random salt
      const salt = crypto.randomBytes(this.saltLength);

      // Derive encryption key using PBKDF2
      const key = crypto.pbkdf2Sync(
        config.encryption.secret,
        salt,
        this.iterations,
        this.keyLength,
        this.digest
      );

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);

      // Encrypt the data
      let encrypted = cipher.update(data, 'utf8', this.encoding);
      encrypted += cipher.final(this.encoding);

      // Get the auth tag
      const tag = cipher.getAuthTag();

      // Combine the salt, iv, tag, and encrypted data
      const result = Buffer.concat([
        salt,
        iv,
        tag,
        Buffer.from(encrypted, this.encoding)
      ]).toString(this.encoding);

      return result;
    } catch (error) {
      logger.error('Encryption failed:', error);
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to encrypt data'
      );
    }
  }

  /**
   * Decrypts encrypted data using AES-256-GCM
   */
  public async decrypt(encryptedData: string): Promise<string> {
    try {
      // Convert the entire encrypted string to buffer
      const inputBuffer = Buffer.from(encryptedData, this.encoding);

      // Extract the salt, iv, tag, and encrypted data
      const salt = inputBuffer.slice(0, this.saltLength);
      const iv = inputBuffer.slice(this.saltLength, this.saltLength + this.ivLength);
      const tag = inputBuffer.slice(
        this.saltLength + this.ivLength,
        this.saltLength + this.ivLength + this.tagLength
      );
      const encrypted = inputBuffer.slice(this.saltLength + this.ivLength + this.tagLength);

      // Derive the key using PBKDF2
      const key = crypto.pbkdf2Sync(
        config.encryption.secret,
        salt,
        this.iterations,
        this.keyLength,
        this.digest
      );

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(tag);

      // Decrypt the data
      let decrypted = decipher.update(encrypted.toString(this.encoding), this.encoding, 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('Decryption failed:', error);
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to decrypt data'
      );
    }
  }

  /**
   * Generates a secure hash of the input using SHA-256
   */
  public async hash(data: string): Promise<string> {
    try {
      const salt = crypto.randomBytes(this.saltLength);
      const hash = crypto.pbkdf2Sync(
        data,
        salt,
        this.iterations,
        this.keyLength,
        this.digest
      );
      
      return Buffer.concat([salt, hash]).toString(this.encoding);
    } catch (error) {
      logger.error('Hashing failed:', error);
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to hash data'
      );
    }
  }

  /**
   * Verifies if the input matches the stored hash
   */
  public async verifyHash(data: string, storedHash: string): Promise<boolean> {
    try {
      const inputBuffer = Buffer.from(storedHash, this.encoding);
      const salt = inputBuffer.slice(0, this.saltLength);
      const originalHash = inputBuffer.slice(this.saltLength);

      const hash = crypto.pbkdf2Sync(
        data,
        salt,
        this.iterations,
        this.keyLength,
        this.digest
      );

      return crypto.timingSafeEqual(hash, originalHash);
    } catch (error) {
      logger.error('Hash verification failed:', error);
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to verify hash'
      );
    }
  }

  /**
   * Generates a random token
   */
  public generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString(this.encoding);
  }

  /**
   * Generates a secure password hash using bcrypt
   */
  public async hashPassword(password: string): Promise<string> {
    try {
      const salt = crypto.randomBytes(this.saltLength);
      const hash = crypto.pbkdf2Sync(
        password,
        salt,
        this.iterations,
        this.keyLength,
        this.digest
      );
      
      return Buffer.concat([salt, hash]).toString(this.encoding);
    } catch (error) {
      logger.error('Password hashing failed:', error);
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to hash password'
      );
    }
  }

  /**
   * Verifies a password against its hash
   */
  public async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return this.verifyHash(password, hashedPassword);
  }

  /**
   * Generates a random initialization vector
   */
  private generateIV(): Buffer {
    return crypto.randomBytes(this.ivLength);
  }

  /**
   * Generates a random salt
   */
  private generateSalt(): Buffer {
    return crypto.randomBytes(this.saltLength);
  }
}

export const encryptionService = new EncryptionService();