interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline";
  href?: string;
  children: React.ReactNode;
}

const base = "inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-all duration-200 cursor-pointer";

const variants = {
  primary: "bg-gradient-to-r from-accent to-accent-hover text-[#0a0a0f] font-semibold hover:shadow-[0_0_20px_var(--color-accent-glow),0_0_40px_var(--color-accent-glow)]",
  ghost: "text-text-secondary hover:text-accent hover:bg-accent/10",
  outline: "border border-border text-text-primary hover:border-accent hover:text-accent hover:shadow-[0_0_20px_var(--color-accent-glow)]",
};

export default function Button({ variant = "primary", href, children, ...props }: ButtonProps) {
  const classes = `${base} ${variants[variant]}`;

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
