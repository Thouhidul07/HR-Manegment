import type { ReactNode, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
}

export function Button({ 
  children, 
  variant = "primary", 
  size = "md", 
  className = "",
  ...props 
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variantStyles = {
    primary: "bg-action text-action-foreground hover:opacity-90 shadow-sm",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-border bg-transparent hover:bg-accent",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
  };

  return (
    <button 
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
