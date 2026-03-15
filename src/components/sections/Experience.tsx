import { motion } from "framer-motion";
import Section from "../layout/Section";
import SectionHeading from "../ui/SectionHeading";
import { experiences } from "../../constants/data";
import {
  terminalFadeIn,
  terminalLineReveal,
  staggerTerminalLines,
  staggerContainerSlow,
  viewportConfig,
} from "../../lib/animations";

function slugify(company: string) {
  return company.split(",")[0].replace(/\s+/g, "").toLowerCase();
}

export default function Experience() {
  return (
    <Section id="experience" className="bg-bg-secondary">
      <SectionHeading title="Experience" subtitle="Where I've worked" />

      <motion.div
        className="relative mx-auto flex max-w-2xl flex-col items-center"
        variants={staggerContainerSlow}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
      >
        {experiences.map((exp, i) => {
          const slug = slugify(exp.company);
          const command = `cat ${slug}.yml`;
          const charCount = command.length + 2; // +2 for "$ "

          return (
            <div key={exp.company} className="w-full">
              {/* Dashed connector between terminals */}
              {i > 0 && <div className="terminal-connector" />}

              <motion.div variants={terminalFadeIn} className="terminal">
                {/* Title bar */}
                <div className="terminal-titlebar">
                  <div className="flex gap-1.5">
                    <span
                      className="terminal-dot"
                      style={{ backgroundColor: "#ff5f57" }}
                    />
                    <span
                      className="terminal-dot"
                      style={{ backgroundColor: "#febc2e" }}
                    />
                    <span
                      className="terminal-dot"
                      style={{ backgroundColor: "#28c840" }}
                    />
                  </div>
                  <span className="font-mono text-xs text-text-secondary">
                    jason@portfolio: ~/career
                  </span>
                </div>

                {/* Body */}
                <div className="terminal-body">
                  {/* Command with typing animation */}
                  <div
                    className="terminal-typing-line"
                    style={
                      { "--typing-steps": charCount } as React.CSSProperties
                    }
                  >
                    <span className="text-accent">$</span> {command}
                  </div>

                  {/* YAML output — staggered reveal */}
                  <motion.div variants={staggerTerminalLines} className="mt-2">
                    <motion.p variants={terminalLineReveal}>
                      <span className="text-accent">company:</span>{" "}
                      {exp.company}
                    </motion.p>
                    <motion.p variants={terminalLineReveal}>
                      <span className="text-accent">role:</span> {exp.role}
                    </motion.p>
                    <motion.p variants={terminalLineReveal}>
                      <span className="text-accent">period:</span> {exp.period}
                    </motion.p>
                  </motion.div>

                  {/* Blinking cursor prompt */}
                  <div className="mt-3">
                    <span className="text-accent">$</span>{" "}
                    <span className="terminal-cursor">▌</span>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
      </motion.div>
    </Section>
  );
}
