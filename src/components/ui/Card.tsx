import { useRef, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { FiGithub, FiExternalLink } from "react-icons/fi";
import { fadeInUp, fadeInScale } from "../../lib/animations";
import type { Project } from "../../types";

interface CardProps {
  project: Project;
  index: number;
  featured?: boolean;
}

const springConfig = { stiffness: 200, damping: 20, mass: 0.5 };

export default function Card({ project, index, featured }: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const accent = project.accent ?? "#22d3ee";
  const indexLabel = String(index + 1).padStart(2, "0");

  // 3D tilt motion values
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-8, 8]), springConfig);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Disable tilt on touch devices
      if (!window.matchMedia("(hover: hover)").matches) return;
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    },
    [mouseX, mouseY]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }, [mouseX, mouseY]);

  const techTags = (
    <div className="mt-4 flex flex-wrap gap-2">
      {project.tech.map((t) => (
        <span
          key={t}
          className="rounded-full px-2.5 py-0.5 font-mono text-xs transition-colors duration-300"
          style={{
            backgroundColor: `color-mix(in srgb, ${accent} 10%, var(--color-bg-surface))`,
            color: `color-mix(in srgb, ${accent} 60%, var(--color-text-secondary))`,
          }}
        >
          {t}
        </span>
      ))}
    </div>
  );

  const links = (
    <div className="mt-4 flex gap-3 border-t border-border pt-4">
      {project.github && (
        <a
          href={project.github}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-heading"
          style={{ "--hover-color": accent } as React.CSSProperties}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = accent)
          }
          onMouseLeave={(e) => (e.currentTarget.style.color = "")}
        >
          <FiGithub size={16} />
          Code
        </a>
      )}
      {project.live && (
        <a
          href={project.live}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-heading"
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = accent)
          }
          onMouseLeave={(e) => (e.currentTarget.style.color = "")}
        >
          <FiExternalLink size={16} />
          Live
        </a>
      )}
    </div>
  );

  if (featured) {
    return (
      <motion.div
        ref={cardRef}
        variants={fadeInScale}
        className="card-border-gradient group"
        style={
          {
            "--card-accent": accent,
            perspective: 800,
            rotateX,
            rotateY,
          } as React.CSSProperties & Record<string, unknown>
        }
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="card-inner relative p-8">
          <span className="card-index card-index-featured select-none">
            {indexLabel}
          </span>

          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            {/* Left: decorative glow area */}
            <div className="relative hidden shrink-0 items-center justify-center overflow-hidden md:flex md:w-48">
              <div
                className="absolute h-32 w-32 rounded-full blur-3xl"
                style={{ backgroundColor: accent, opacity: 0.15 }}
              />
              <span
                className="relative font-display text-[7rem] font-black leading-none"
                style={{ color: accent, opacity: 0.12 }}
              >
                {indexLabel}
              </span>
            </div>

            {/* Right: content */}
            <div className="flex-1">
              <h3 className="font-display text-2xl font-bold text-text-heading transition-colors duration-300 group-hover:text-gradient">
                {project.title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-text-secondary">
                {project.description}
              </p>
              {techTags}
              {links}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={cardRef}
      variants={fadeInUp}
      className="card-border-gradient group"
      style={
        {
          "--card-accent": accent,
          perspective: 800,
          rotateX,
          rotateY,
        } as React.CSSProperties & Record<string, unknown>
      }
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="card-inner relative flex flex-col p-6">
        <span className="card-index select-none">{indexLabel}</span>

        <h3 className="font-display text-lg font-semibold text-text-heading transition-colors duration-300 group-hover:text-gradient">
          {project.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">
          {project.description}
        </p>
        {techTags}
        {links}
      </div>
    </motion.div>
  );
}
