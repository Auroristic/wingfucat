import { BaseAuthStore, type AuthRecord } from 'pocketbase';

/**
 * PublicDeviceAuthStore provides public-device safe session storage.
 *
 * Defaults to sessionStorage (rememberMe = false) so that tokens are wiped
 * on tab/browser close, preventing session hijacking on shared/public devices.
 * Only persists to localStorage when the user explicitly checks "Remember this device".
 */
export class PublicDeviceAuthStore extends BaseAuthStore {
  private storageKey: string;
  private rememberMe: boolean = false;

  constructor(storageKey = 'pocketbase_auth') {
    super();
    this.storageKey = storageKey;
    this.loadInitial();
  }

  private loadInitial() {
    if (typeof window === 'undefined') return;

    // 1. Session storage has priority for active tab session
    try {
      const sessionRaw = window.sessionStorage?.getItem(this.storageKey);
      if (sessionRaw) {
        const data = JSON.parse(sessionRaw);
        if (data?.token) {
          super.save(data.token, data.record || data.model || null);
          this.rememberMe = false;
          return;
        }
      }
    } catch (_) {
      window.sessionStorage?.removeItem(this.storageKey);
    }

    // 2. Local storage for persisted trusted device
    try {
      const localRaw = window.localStorage?.getItem(this.storageKey);
      if (localRaw) {
        const data = JSON.parse(localRaw);
        if (data?.token) {
          super.save(data.token, data.record || data.model || null);
          this.rememberMe = true;
          return;
        }
      }
    } catch (_) {
      window.localStorage?.removeItem(this.storageKey);
    }
  }

  public setRememberMe(remember: boolean) {
    this.rememberMe = remember;
  }

  public getRememberMe(): boolean {
    return this.rememberMe;
  }

  override save(token: string, record?: AuthRecord) {
    super.save(token, record);

    if (typeof window === 'undefined') return;

    try {
      const data = JSON.stringify({ token, record });
      if (this.rememberMe) {
        window.localStorage?.setItem(this.storageKey, data);
        window.sessionStorage?.removeItem(this.storageKey);
      } else {
        window.sessionStorage?.setItem(this.storageKey, data);
        window.localStorage?.removeItem(this.storageKey);
      }
    } catch (_) {
      // Ignore storage write failures (e.g. private browsing quota restrictions)
    }
  }

  override clear() {
    super.clear();

    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage?.removeItem(this.storageKey);
        window.localStorage?.removeItem(this.storageKey);
      } catch (_) {
        // Ignore storage removal failures
      }
    }
  }
}
