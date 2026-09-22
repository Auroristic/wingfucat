import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './components/LoginView';
import { LiveMessageThread } from './components/MessageThread';
import { MessageComposer } from './components/MessageComposer';
import { Icon } from './components/Icon';

function AuthenticatedApp() {
  const { user, logout } = useAuth();

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="flex h-dvh flex-col bg-black text-white">
      {/* Header bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4">
        <div className="flex items-center gap-2">
          <Icon name="chat" className="text-xl text-zinc-300" />
          <h1 className="text-sm font-semibold tracking-wide">wingfucat</h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400">
            {user.display_name || user.username || user.email || 'Partner'}
          </span>
          <button
            type="button"
            onClick={logout}
            aria-label="Log out"
            className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors cursor-pointer"
          >
            <Icon name="logout" className="text-base" />
            <span>Log out</span>
          </button>
        </div>
      </header>

      {/* Main chat thread */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <LiveMessageThread className="flex-1" />
      </main>

      {/* Message Composer */}
      <footer className="shrink-0">
        <MessageComposer currentUserId={user.id} />
      </footer>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;
