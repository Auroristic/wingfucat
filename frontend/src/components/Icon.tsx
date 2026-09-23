export function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span aria-hidden="true" className={`material-symbols-rounded select-none ${className}`}>
      {name}
    </span>
  );
}

export default Icon;
