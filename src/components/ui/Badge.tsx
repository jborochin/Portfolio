import { motion } from "framer-motion";
import { scaleIn } from "../../lib/animations";

interface BadgeProps {
  children: React.ReactNode;
}

export default function Badge({ children }: BadgeProps) {
  return (
    <motion.span
      variants={scaleIn}
      className="inline-block rounded-full border border-border bg-bg-elevated px-3 py-1 text-sm text-text-secondary transition-colors hover:border-accent/40 hover:text-accent hover:shadow-[0_0_12px_var(--color-accent-glow)]"
    >
      {children}
    </motion.span>
  );
}
