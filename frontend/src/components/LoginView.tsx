import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Icon } from './Icon';

export function LoginView() {
  const { login, isLoading } = useAuth();
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setError(null);
    try {
      await login(identity.trim(), password, rememberDevice);
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate. Please check your credentials.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4 text-white">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800">
            <Icon name="lock" className="text-2xl text-white" />
          </div>
          <h1 className="text-xl font-semibold tracking-wide text-white">wingfucat</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-900/50 bg-red-950/40 p-3 text-xs text-red-300"
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="identity"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400"
            >
              Username
            </label>
            <input
              id="identity"
              type="text"
              autoComplete="username"
              required
              disabled={isLoading}
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              placeholder="Username or email"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50"
            />
          </div>

          <div className="pt-1">
            <label
              htmlFor="remember-device"
              className="flex cursor-pointer select-none items-start gap-2.5"
            >
              <input
                id="remember-device"
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                disabled={isLoading}
                className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-white accent-white focus:ring-white focus:ring-offset-black"
              />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-white">Remember this device</span>
                <span className="text-[11px] text-zinc-400">
                  (Leave unchecked on public computers)
                </span>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full cursor-pointer rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginView;
