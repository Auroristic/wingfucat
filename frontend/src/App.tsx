import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './components/LoginView';
import { Icon } from './components/Icon';

function AuthenticatedApp() {
  const { user, logout } = useAuth();

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4 text-white">
      <div className="flex items-center gap-2 mb-2">
        <Icon name="chat" className="text-3xl" />
        <h1 className="text-xl font-semibold tracking-wide">wingfucat</h1>
      </div>
      <p className="text-sm text-zinc-400">
        Signed in as{' '}
        <span className="text-white font-medium">
          {user.display_name || user.username || user.email || 'Partner'}
        </span>
      </p>
      <button
        onClick={logout}
        className="mt-4 flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
      >
        <Icon name="logout" className="text-base" />
        Log out
      </button>
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

