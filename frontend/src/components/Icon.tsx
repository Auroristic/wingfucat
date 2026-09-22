export function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded select-none ${className}`}>{name}</span>;
}

export default Icon;
