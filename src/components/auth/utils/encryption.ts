import CryptoJS from 'crypto-js';

// Krypteringsnøgle - bør gemmes sikkert i miljøvariable
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default-key';

/**
 * Krypterer en tekststreng
 * @param text Tekst der skal krypteres
 * @returns Krypteret tekst
 */
export const encrypt = (text: string): string => {
  try {
    const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY);
    return encrypted.toString();
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Kunne ikke kryptere data');
  }
};

/**
 * Dekrypterer en krypteret tekststreng
 * @param encryptedText Krypteret tekst der skal dekrypteres
 * @returns Dekrypteret tekst
 */
export const decrypt = (encryptedText: string): string => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Kunne ikke dekryptere data');
  }
};

/**
 * Genererer en sikker hash af en tekststreng
 * @param text Tekst der skal hashes
 * @returns Hash værdi
 */
export const generateHash = (text: string): string => {
  try {
    return CryptoJS.SHA256(text).toString();
  } catch (error) {
    console.error('Hash generation error:', error);
    throw new Error('Kunne ikke generere hash');
  }
};

/**
 * Krypterer et objekt til JSON string
 * @param data Objekt der skal krypteres
 * @returns Krypteret JSON string
 */
export const encryptObject = <T>(data: T): string => {
  try {
    const jsonString = JSON.stringify(data);
    return encrypt(jsonString);
  } catch (error) {
    console.error('Object encryption error:', error);
    throw new Error('Kunne ikke kryptere objekt');
  }
};

/**
 * Dekrypterer en JSON string til et objekt
 * @param encryptedData Krypteret JSON string
 * @returns Dekrypteret objekt
 */
export const decryptObject = <T>(encryptedData: string): T => {
  try {
    const decryptedString = decrypt(encryptedData);
    return JSON.parse(decryptedString) as T;
  } catch (error) {
    console.error('Object decryption error:', error);
    throw new Error('Kunne ikke dekryptere objekt');
  }
};

/**
 * Genererer en tilfældig nøgle med specificeret længde
 * @param length Længde af nøglen
 * @returns Tilfældig nøgle
 */
export const generateRandomKey = (length: number = 32): string => {
  try {
    const randomWords = CryptoJS.lib.WordArray.random(length / 2);
    return randomWords.toString();
  } catch (error) {
    console.error('Key generation error:', error);
    throw new Error('Kunne ikke generere nøgle');
  }
};

/**
 * Validerer om en streng er krypteret
 * @param text Tekst der skal valideres
 * @returns Boolean der indikerer om teksten er krypteret
 */
export const isEncrypted = (text: string): boolean => {
  try {
    // Forsøg at dekryptere - hvis det fejler er teksten ikke krypteret
    decrypt(text);
    return true;
  } catch {
    return false;
  }
};

/**
 * Sammenligner to krypterede værdier
 * @param encrypted1 Første krypterede værdi
 * @param encrypted2 Anden krypterede værdi
 * @returns Boolean der indikerer om værdierne er ens
 */
export const compareEncrypted = (encrypted1: string, encrypted2: string): boolean => {
  try {
    const decrypted1 = decrypt(encrypted1);
    const decrypted2 = decrypt(encrypted2);
    return decrypted1 === decrypted2;
  } catch {
    return false;
  }
};