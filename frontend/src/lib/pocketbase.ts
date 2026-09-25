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

export async function getArchiveBoundaryTimestamp(): Promise<string> {
  try {
    const latestMsgList = await pb.collection('messages').getList(1, 1, {
      sort: '-created',
    });
    if (latestMsgList.items.length > 0) {
      return latestMsgList.items[0].created;
    }
  } catch (_) {}

  try {
    const res = await fetch(`${pb.baseUrl}/api/health`, { method: 'HEAD' });
    const serverDate = res.headers.get('date');
    if (serverDate) {
      const d = new Date(serverDate);
      return d.toISOString().replace('T', ' ');
    }
  } catch (_) {}

  return new Date().toISOString().replace('T', ' ');
}

export default pb;


