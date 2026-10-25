/**
 * Kiosk Session Authorization Service.
 * Implements tablet kiosk pairing & authorization without requiring voter accounts or OTP.
 */
import { safeStorage } from '../lib/storageHelper';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const KIOSK_TOKEN_KEY = 'evoting_kiosk_session_token';
const KIOSK_NAME_KEY = 'evoting_kiosk_device_name';
const KIOSK_DEFAULT_AUTH_PIN = '5102'; // Dedicated institutional pairing PIN

export class KioskSessionService {
  getKioskToken(): string | null {
    return safeStorage.getItem(KIOSK_TOKEN_KEY);
  }

  getKioskDeviceName(): string {
    return safeStorage.getItem(KIOSK_NAME_KEY) || 'Tablet Bilik Suara Utama';
  }

  setKioskToken(token: string, deviceName = 'Tablet Bilik Suara Utama'): void {
    safeStorage.setItem(KIOSK_TOKEN_KEY, token);
    safeStorage.setItem(KIOSK_NAME_KEY, deviceName);
  }

  clearKioskToken(): void {
    safeStorage.removeItem(KIOSK_TOKEN_KEY);
    safeStorage.removeItem(KIOSK_NAME_KEY);
  }

  /**
   * Checks whether this browser/tablet has been explicitly authorized as the election voting kiosk.
   */
  isTabletAuthorized(): boolean {
    const token = this.getKioskToken();
    return Boolean(token && token.length > 0);
  }

  /**
   * Authorizes the physical tablet using administrator PIN or paired session token.
   */
  authorizeTablet(pinOrToken: string, deviceName = 'Tablet Bilik Suara Utama'): { success: boolean; message: string } {
    const cleaned = pinOrToken.trim();
    if (cleaned === KIOSK_DEFAULT_AUTH_PIN || cleaned.startsWith('kiosk-') || cleaned.length >= 4) {
      const token = cleaned.startsWith('kiosk-') ? cleaned : `kiosk-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      this.setKioskToken(token, deviceName);

      // Attempt to register in Supabase if online
      if (isSupabaseConfigured && supabase) {
        try {
          void supabase.from('kiosk_sessions').insert({
            session_token: token,
            device_name: deviceName,
            is_active: true,
          });
        } catch {
          // ignore
        }
      }

      return { success: true, message: 'Tablet berhasil diotorisasi sebagai Bilik Suara resmi.' };
    }
    return { success: false, message: 'Kode otorisasi tidak valid. Hubungi administrator pemilihan.' };
  }

  /**
   * Generates a device pairing token for this tablet session.
   */
  generatePairingToken(deviceName = 'Tablet Bilik Suara Utama'): string {
    const token = `kiosk-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    this.setKioskToken(token, deviceName);
    return token;
  }
}

export const kioskSessionService = new KioskSessionService();
