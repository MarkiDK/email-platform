import { Buffer } from 'buffer';
import * as openpgp from 'openpgp';
import { KeyPair } from '../types/encryption.types';

export class EncryptionService {
  private static instance: EncryptionService;
  private keyCache: Map<string, KeyPair>;

  private constructor() {
    this.keyCache = new Map();
  }

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Genererer et nyt PGP nøglepar
   */
  public async generateKeyPair(email: string, passphrase: string): Promise<KeyPair> {
    try {
      const { privateKey, publicKey } = await openpgp.generateKey({
        type: 'ecc',
        curve: 'curve25519',
        userIDs: [{ email }],
        passphrase,
        format: 'armored'
      });

      const keyPair: KeyPair = {
        publicKey,
        privateKey,
        email,
        createdAt: new Date().toISOString()
      };

      this.keyCache.set(email, keyPair);
      return keyPair;
    } catch (error) {
      console.error('Fejl ved generering af nøglepar:', error);
      throw new Error('Kunne ikke generere nøglepar');
    }
  }

  /**
   * Krypterer en besked med modtagerens offentlige nøgle
   */
  public async encryptMessage(
    message: string,
    recipientPublicKey: string,
    senderPrivateKey?: string,
    passphrase?: string
  ): Promise<string> {
    try {
      const publicKey = await openpgp.readKey({ armoredKey: recipientPublicKey });
      
      const encryptionOptions: any = {
        message: await openpgp.createMessage({ text: message }),
        encryptionKeys: publicKey
      };

      // Hvis afsender ønsker at signere beskeden
      if (senderPrivateKey && passphrase) {
        const privateKey = await openpgp.decryptKey({
          privateKey: await openpgp.readPrivateKey({ armoredKey: senderPrivateKey }),
          passphrase
        });
        encryptionOptions.signingKeys = privateKey;
      }

      const encrypted = await openpgp.encrypt(encryptionOptions);
      return encrypted as string;
    } catch (error) {
      console.error('Fejl ved kryptering af besked:', error);
      throw new Error('Kunne ikke kryptere beskeden');
    }
  }

  /**
   * Dekrypterer en besked med modtagerens private nøgle
   */
  public async decryptMessage(
    encryptedMessage: string,
    privateKey: string,
    passphrase: string,
    senderPublicKey?: string
  ): Promise<{
    message: string;
    verified: boolean;
  }> {
    try {
      const decryptedPrivateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
        passphrase
      });

      const message = await openpgp.readMessage({
        armoredMessage: encryptedMessage
      });

      const decryptionOptions: any = {
        message,
        decryptionKeys: decryptedPrivateKey
      };

      // Hvis afsenderens offentlige nøgle er tilgængelig, verificer signaturen
      if (senderPublicKey) {
        decryptionOptions.verificationKeys = await openpgp.readKey({ armoredKey: senderPublicKey });
      }

      const { data: decrypted, signatures } = await openpgp.decrypt(decryptionOptions);

      // Verificer signatur hvis tilgængelig
      let verified = false;
      if (signatures.length > 0) {
        try {
          await signatures[0].verified;
          verified = true;
        } catch (error) {
          console.warn('Signatur kunne ikke verificeres:', error);
        }
      }

      return {
        message: decrypted as string,
        verified
      };
    } catch (error) {
      console.error('Fejl ved dekryptering af besked:', error);
      throw new Error('Kunne ikke dekryptere beskeden');
    }
  }

  /**
   * Krypterer en fil
   */
  public async encryptFile(
    file: File,
    recipientPublicKey: string,
    senderPrivateKey?: string,
    passphrase?: string
  ): Promise<{
    encryptedData: Uint8Array;
    filename: string;
  }> {
    try {
      const fileBuffer = await file.arrayBuffer();
      const message = await openpgp.createMessage({
        binary: new Uint8Array(fileBuffer),
        filename: file.name
      });

      const publicKey = await openpgp.readKey({ armoredKey: recipientPublicKey });
      
      const encryptionOptions: any = {
        message,
        encryptionKeys: publicKey,
        format: 'binary'
      };

      if (senderPrivateKey && passphrase) {
        const privateKey = await openpgp.decryptKey({
          privateKey: await openpgp.readPrivateKey({ armoredKey: senderPrivateKey }),
          passphrase
        });
        encryptionOptions.signingKeys = privateKey;
      }

      const encrypted = await openpgp.encrypt(encryptionOptions);
      
      return {
        encryptedData: encrypted as Uint8Array,
        filename: `${file.name}.pgp`
      };
    } catch (error) {
      console.error('Fejl ved kryptering af fil:', error);
      throw new Error('Kunne ikke kryptere filen');
    }
  }

  /**
   * Dekrypterer en fil
   */
  public async decryptFile(
    encryptedData: Uint8Array,
    privateKey: string,
    passphrase: string,
    senderPublicKey?: string
  ): Promise<{
    decryptedData: Uint8Array;
    filename: string;
    verified: boolean;
  }> {
    try {
      const decryptedPrivateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
        passphrase
      });

      const message = await openpgp.readMessage({
        binaryMessage: encryptedData
      });

      const decryptionOptions: any = {
        message,
        decryptionKeys: decryptedPrivateKey,
        format: 'binary'
      };

      if (senderPublicKey) {
        decryptionOptions.verificationKeys = await openpgp.readKey({ armoredKey: senderPublicKey });
      }

      const { data: decrypted, filename, signatures } = await openpgp.decrypt(decryptionOptions);

      let verified = false;
      if (signatures.length > 0) {
        try {
          await signatures[0].verified;
          verified = true;
        } catch (error) {
          console.warn('Filsignatur kunne ikke verificeres:', error);
        }
      }

      return {
        decryptedData: decrypted as Uint8Array,
        filename: filename || 'decrypted_file',
        verified
      };
    } catch (error) {
      console.error('Fejl ved dekryptering af fil:', error);
      throw new Error('Kunne ikke dekryptere filen');
    }
  }

  /**
   * Validerer en offentlig nøgle
   */
  public async validatePublicKey(publicKey: string): Promise<boolean> {
    try {
      await openpgp.readKey({ armoredKey: publicKey });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validerer en privat nøgle og dens adgangskode
   */
  public async validatePrivateKey(privateKey: string, passphrase: string): Promise<boolean> {
    try {
      await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
        passphrase
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Henter email-adressen fra en offentlig nøgle
   */
  public async getKeyEmail(publicKey: string): Promise<string | null> {
    try {
      const key = await openpgp.readKey({ armoredKey: publicKey });
      const userIds = key.getUserIDs();
      if (userIds.length > 0) {
        const email = userIds[0].match(/<(.+)>/)?.[1];
        return email || null;
      }
      return null;
    } catch (error) {
      console.error('Fejl ved læsning af nøgle:', error);
      return null;
    }
  }

  /**
   * Eksporterer en offentlig nøgle i ASCII-armor format
   */
  public async exportPublicKey(publicKey: string): Promise<string> {
    try {
      const key = await openpgp.readKey({ armoredKey: publicKey });
      return key.armor();
    } catch (error) {
      console.error('Fejl ved eksport af offentlig nøgle:', error);
      throw new Error('Kunne ikke eksportere offentlig nøgle');
    }
  }

  /**
   * Rydder nøglecachen
   */
  public clearKeyCache(): void {
    this.keyCache.clear();
  }
}

export default EncryptionService.getInstance();