import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { FiArrowDown } from "react-icons/fi";
import AnimatedText from "../ui/AnimatedText";
import Button from "../ui/Button";

const heroOrb = {
  initial: { scale: 1, opacity: 0.5 },
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.5, 0.8, 0.5],
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut" as const },
  },
};

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const scale = useTransform(scrollYProgress, [0, 0.7, 1], [1, 1, 0.95]);

  return (
    <motion.section
      ref={ref}
      id="hero"
      className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center"
      style={{
        opacity,
        y,
        scale,
        willChange: "transform, opacity",
      }}
    >
        {/* Ambient gradient orb */}
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-gradient-to-r from-accent/10 to-secondary/10 blur-3xl"
          variants={heroOrb}
          initial="initial"
          animate="animate"
        />

        <motion.div
          className="relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p className="mb-4 font-mono text-xs tracking-[0.3em] text-accent uppercase">
            Portfolio
          </p>

          <h1 className="font-display text-6xl font-bold tracking-tight md:text-8xl">
            <span className="text-gradient">
              <AnimatedText text="Jason Borochin" />
            </span>
          </h1>

          <motion.p
            className="mt-4 text-lg text-text-secondary md:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Computer Engineering @ UIUC
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            <Button href="#projects">View Projects</Button>
            <Button href="#contact" variant="outline">
              Get in Touch
            </Button>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.a
          href="#about"
          className="absolute bottom-8 text-text-secondary transition-colors hover:text-accent"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          aria-label="Scroll down"
        >
          <FiArrowDown size={24} />
        </motion.a>
      </motion.section>
  );
}
