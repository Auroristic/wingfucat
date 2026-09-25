import type { CSSProperties } from 'react';

export function Icon({ name, className = "", style }: { name: string; className?: string; style?: CSSProperties }) {
  return (
    <span aria-hidden="true" style={style} className={`material-symbols-rounded select-none ${className}`}>
      {name}
    </span>
  );
}

export default Icon;
