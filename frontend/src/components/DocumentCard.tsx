import { Icon } from './Icon';
import { formatBytes, getFileIconName } from '../utils/fileHelpers';
import { useTheme } from '../context/ThemeContext';

export interface DocumentCardProps {
  fileName?: string;
  fileSize?: number;
  fileUrl: string;
  isSelf?: boolean;
  className?: string;
}

export function DocumentCard({
  fileName = 'file',
  fileSize,
  fileUrl,
  isSelf = false,
  className = '',
}: DocumentCardProps) {
  const { theme } = useTheme();
  const isTui = theme.id === 'terminal-tui';
  const iconName = getFileIconName(fileName);

  return (
    <div
      data-testid="document-card"
      className={`my-1 flex items-center justify-between gap-3 p-3 transition-all ${
        isTui
          ? 'rounded-none border border-[#00ff41] bg-black text-[#00ff41] font-mono text-xs'
          : isSelf
          ? 'rounded-xl border border-white/20 bg-white/10 text-inherit backdrop-blur-md'
          : 'rounded-xl border border-zinc-700/50 bg-zinc-800/80 text-zinc-100 backdrop-blur-md'
      } ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center ${
            isTui
              ? 'border border-[#00ff41] text-[#00ff41]'
              : isSelf
              ? 'rounded-lg bg-white/20 text-inherit'
              : 'rounded-lg bg-zinc-700/60 text-zinc-200'
          }`}
        >
          <Icon name={iconName} className="text-2xl" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="truncate max-w-[200px] sm:max-w-xs font-semibold text-xs sm:text-sm">
            {isTui ? `[FILE: ${fileName}]` : fileName}
          </span>
          {fileSize !== undefined && (
            <span
              className={`text-[11px] ${
                isTui ? 'text-[#00ff41]/80' : isSelf ? 'opacity-80' : 'text-zinc-400'
              }`}
            >
              {formatBytes(fileSize)}
            </span>
          )}
        </div>
      </div>

      <a
        href={fileUrl}
        download={fileName}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Download ${fileName}`}
        className={`flex h-8 w-8 shrink-0 items-center justify-center transition-colors cursor-pointer ${
          isTui
            ? 'border border-[#00ff41] hover:bg-[#00ff41] hover:text-black'
            : isSelf
            ? 'rounded-full bg-white/20 hover:bg-white/30 text-inherit'
            : 'rounded-full bg-zinc-700 hover:bg-zinc-600 text-zinc-200 hover:text-white'
        }`}
      >
        <Icon name="download" className="text-base" />
      </a>
    </div>
  );
}

export default DocumentCard;
