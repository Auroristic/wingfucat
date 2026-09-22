import '@testing-library/jest-dom';

// Polyfill localStorage and sessionStorage for happy-dom in Node 26
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

const mockLocalStorage = new MemoryStorage();
const mockSessionStorage = new MemoryStorage();

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, 'sessionStorage', {
  value: mockSessionStorage,
  configurable: true,
  writable: true,
});

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    configurable: true,
    writable: true,
  });

  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
    configurable: true,
    writable: true,
  });
}

if (typeof globalThis.EventSource === 'undefined') {
  class MockEventSource {
    url: string;
    onopen: ((ev: any) => any) | null = null;
    onmessage: ((ev: any) => any) | null = null;
    onerror: ((ev: any) => any) | null = null;
    readyState = 1;
    constructor(url: string) {
      this.url = url;
    }
    close() {}
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() {
      return true;
    }
  }
  Object.defineProperty(globalThis, 'EventSource', {
    value: MockEventSource,
    configurable: true,
    writable: true,
  });
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'EventSource', {
      value: MockEventSource,
      configurable: true,
      writable: true,
    });
  }
}

if (typeof globalThis.MediaRecorder === 'undefined') {
  class MockMediaRecorder {
    static isTypeSupported(mime: string) {
      return mime.startsWith('audio/webm') || mime.startsWith('audio/mp4');
    }
    state = 'inactive';
    stream: any;
    mimeType: string;
    ondataavailable: ((e: any) => void) | null = null;
    onstop: (() => void) | null = null;
    onerror: ((e: any) => void) | null = null;

    constructor(stream: any, options?: any) {
      this.stream = stream;
      this.mimeType = options?.mimeType || 'audio/webm;codecs=opus';
    }

    start() {
      this.state = 'recording';
    }

    stop() {
      this.state = 'inactive';
      if (this.ondataavailable) {
        this.ondataavailable({ data: new Blob(['mock-audio-bytes'], { type: this.mimeType }) });
      }
      if (this.onstop) {
        this.onstop();
      }
    }
  }

  Object.defineProperty(globalThis, 'MediaRecorder', {
    value: MockMediaRecorder,
    configurable: true,
    writable: true,
  });
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'MediaRecorder', {
      value: MockMediaRecorder,
      configurable: true,
      writable: true,
    });
  }
}

if (typeof navigator !== 'undefined' && !navigator.mediaDevices) {
  const mockMediaDevices = {
    getUserMedia: async () => {
      const mockTrack = { stop: () => {}, kind: 'audio', enabled: true };
      return {
        getTracks: () => [mockTrack],
        getAudioTracks: () => [mockTrack],
      };
    },
  };
  Object.defineProperty(navigator, 'mediaDevices', {
    value: mockMediaDevices,
    configurable: true,
    writable: true,
  });
}


// Suppress known React 19 act(...) warnings for asynchronous state updates in happy-dom
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('was not wrapped in act(...)')
  ) {
    return;
  }
  originalConsoleError(...args);
};
