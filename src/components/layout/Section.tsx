import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface SectionProps {
  id: string;
  className?: string;
  children: React.ReactNode;
}

export default function Section({ id, className = "", children }: SectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.15, 0.85, 1],
    [0, 1, 1, 0]
  );

  const y = useTransform(
    scrollYProgress,
    [0, 0.15, 0.85, 1],
    [40, 0, 0, -40]
  );

  const scale = useTransform(
    scrollYProgress,
    [0, 0.15, 0.85, 1],
    [0.97, 1, 1, 0.97]
  );

  return (
    <motion.section
      ref={ref}
      id={id}
      className={`px-6 py-20 md:py-28 ${className}`}
      style={{
        opacity,
        y,
        scale,
        willChange: "transform, opacity",
      }}
    >
      <div className="mx-auto max-w-5xl">{children}</div>
    </motion.section>
  );
}
