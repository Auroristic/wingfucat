import PocketBase from 'pocketbase';
import { PublicDeviceAuthStore } from './authStore';

const getPocketBaseUrl = (): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PB_URL) {
    return import.meta.env.VITE_PB_URL;
  }
  if (typeof window !== 'undefined') {
    // When developing locally with Vite (port 5173), point to local PocketBase
    if (window.location.port === '5173') {
      return 'http://127.0.0.1:8090';
    }
    return window.location.origin;
  }
  return 'http://127.0.0.1:8090';
};

export const authStore = new PublicDeviceAuthStore();
export const pb = new PocketBase(getPocketBaseUrl(), authStore);

export default pb;

