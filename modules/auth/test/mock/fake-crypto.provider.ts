import { createHash } from "node:crypto";
import { CryptoProvider } from "../../src";

export class FakeCryptoProvider implements CryptoProvider {
  readonly encryptedPasswords: string[] = [];
  readonly comparedPasswords: Array<{
    password: string;
    hashedPassword: string;
  }> = [];

  async encrypt(password: string): Promise<string> {
    this.encryptedPasswords.push(password);
    return this.createHash(password);
  }

  async compare(password: string, hashedPassword: string): Promise<boolean> {
    this.comparedPasswords.push({ password, hashedPassword });
    return this.createHash(password) === hashedPassword;
  }

  private createHash(password: string): string {
    const digest = createHash("sha512")
      .update(`fake-bcrypt:${password}`)
      .digest("base64")
      .replace(/\+/g, ".")
      .replace(/=/g, "A");

    return `$2b$10$${digest.slice(0, 53)}`;
  }
}
