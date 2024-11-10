// Simple className concatenation helper
const combineClasses = (...classes: (string | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

interface DebugLensIconProps {
  className?: string;
  pathClassName?: string;
  accentClassName?: string;
}

export const DebugLensIcon = ({ 
  className, 
  pathClassName = "stroke-blue-400",
  accentClassName = "stroke-violet-400" 
}: DebugLensIconProps) => (
  <svg 
    className={combineClasses("w-6 h-6", className)}
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4Z" 
      className={pathClassName}
      strokeWidth="2"
    />
    <path 
      d="M15 12H12M12 12H9M12 12V9M12 12V15" 
      className={accentClassName}
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <path 
      d="M20 12L22 14M4 12L2 14" 
      className={pathClassName}
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
); 