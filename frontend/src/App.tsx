import { Icon } from './components/Icon';

export function App() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4 text-white">
      <div className="flex items-center gap-2 mb-2">
        <Icon name="chat" className="text-3xl" />
        <h1 className="text-xl font-semibold tracking-wide">wingfucat</h1>
      </div>
      <p className="text-sm text-zinc-400">Private Couple Chat</p>
    </div>
  );
}

export default App;
