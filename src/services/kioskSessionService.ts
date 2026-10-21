/**
 * Kiosk Session Authorization Service.
 * Implements lightweight tablet pairing without voter authentication.
 */
import { safeStorage } from '../lib/storageHelper';

const KIOSK_TOKEN_KEY = 'evoting_kiosk_session_token';

export class KioskSessionService {
  getKioskToken(): string | null {
    return safeStorage.getItem(KIOSK_TOKEN_KEY);
  }

  setKioskToken(token: string): void {
    safeStorage.setItem(KIOSK_TOKEN_KEY, token);
  }

  clearKioskToken(): void {
    safeStorage.removeItem(KIOSK_TOKEN_KEY);
  }

  /**
   * Generates a device pairing token for this tablet session.
   */
  generatePairingToken(): string {
    const token = `kiosk-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    this.setKioskToken(token);
    return token;
  }
}

export const kioskSessionService = new KioskSessionService();
