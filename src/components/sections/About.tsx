import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "framer-motion";
import Section from "../layout/Section";
import SectionHeading from "../ui/SectionHeading";
import { bio, education, stats } from "../../constants/data";
import {
  fadeInUp,
  scaleIn,
  slideInLeft,
  bracketIn,
  viewportConfig,
} from "../../lib/animations";

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v).toString()),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <span ref={ref}>
      {display}
      {inView && suffix}
    </span>
  );
}

function StatValue({ value }: { value: string }) {
  const numMatch = value.match(/^(\d+)(\+?)$/);
  if (numMatch) {
    return (
      <AnimatedCounter value={parseInt(numMatch[1])} suffix={numMatch[2]} />
    );
  }
  return <>{value}</>;
}

const hudStagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0,
    },
  },
};

const dataReadoutStagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.7,
    },
  },
};

const tagsVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: 0.9 },
  },
};

export default function About() {
  const tags = [
    education.school,
    education.expected,
    ...education.clubs,
  ];

  return (
    <Section id="about" className="bg-bg-secondary">
      <SectionHeading title="About Me" subtitle="Who I am and what I do" />

      <motion.div
        className="hud-frame hud-scanline p-6 sm:p-10"
        variants={hudStagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
      >
        {/* Corner brackets */}
        {["tl", "tr", "bl", "br"].map((pos) => (
          <motion.div
            key={pos}
            className={`hud-bracket hud-bracket-${pos}`}
            variants={bracketIn}
          />
        ))}

        {/* Header bar */}
        <motion.div
          className="mb-6 flex items-center justify-between font-mono text-xs uppercase tracking-widest text-accent"
          variants={slideInLeft}
        >
          <span className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-accent terminal-cursor" />
            Personnel File
          </span>
          <span className="hidden text-text-secondary sm:inline">
            File #JB-2027-ECE
          </span>
        </motion.div>

        {/* Bio block */}
        <motion.p
          className="mb-8 max-w-3xl leading-relaxed text-text-primary"
          variants={fadeInUp}
        >
          {bio}
        </motion.p>

        {/* Data readout */}
        <motion.div
          className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4"
          variants={dataReadoutStagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={scaleIn}
              className="flex flex-col items-center rounded-lg border border-border bg-bg-elevated px-4 py-5 transition-all duration-300 hover:shadow-[0_0_20px_var(--color-accent-glow)]"
            >
              <span className="text-gradient font-display text-3xl font-bold">
                <StatValue value={stat.value} />
              </span>
              <span className="mt-1 font-mono text-[0.7rem] uppercase tracking-wider text-text-secondary">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Tags bar */}
        <motion.div
          className="flex flex-wrap gap-2"
          variants={tagsVariant}
        >
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-accent/10 px-3 py-1 font-mono text-xs font-medium text-accent"
            >
              {tag}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </Section>
  );
}
