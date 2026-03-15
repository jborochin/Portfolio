import { motion } from "framer-motion";
import Section from "../layout/Section";
import SectionHeading from "../ui/SectionHeading";
import { bio, education, stats } from "../../constants/data";
import { fadeInUp, staggerContainer, viewportConfig } from "../../lib/animations";

export default function About() {
  return (
    <Section id="about" className="bg-bg-secondary">
      <SectionHeading title="About Me" subtitle="Who I am and what I do" />

      <div className="grid gap-12 md:grid-cols-2 md:items-start">
        {/* Text column */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          <p className="leading-relaxed text-text-primary">{bio}</p>

          <div className="mt-6 space-y-2">
            <p className="font-display font-semibold text-text-heading">{education.degree}</p>
            <p className="text-sm text-text-secondary">
              {education.minor} &middot; {education.school}
            </p>
            <p className="text-sm text-text-secondary">
              GPA: {education.gpa} &middot; {education.expected}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {education.clubs.map((club) => (
                <span
                  key={club}
                  className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent"
                >
                  {club}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats column */}
        <motion.div
          className="grid grid-cols-3 gap-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeInUp}
              className="flex flex-col items-center rounded-xl border border-border bg-bg-elevated p-6 transition-all duration-300 hover:shadow-[0_0_20px_var(--color-accent-glow)]"
            >
              <span className="text-gradient font-display text-3xl font-bold">{stat.value}</span>
              <span className="mt-1 text-sm text-text-secondary">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}
