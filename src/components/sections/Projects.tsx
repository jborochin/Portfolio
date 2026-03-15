import { motion } from "framer-motion";
import Section from "../layout/Section";
import SectionHeading from "../ui/SectionHeading";
import Card from "../ui/Card";
import { projects } from "../../constants/data";
import {
  fadeInScale,
  staggerContainerSlow,
  viewportConfig,
} from "../../lib/animations";

export default function Projects() {
  const [featured, ...rest] = projects;

  return (
    <Section id="projects">
      <SectionHeading title="Projects" subtitle="Things I've built" />

      {/* Featured project — full width */}
      <motion.div
        variants={fadeInScale}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
      >
        <Card project={featured} index={0} featured />
      </motion.div>

      {/* Remaining projects — 2-column grid */}
      <motion.div
        className="mt-6 grid gap-6 md:grid-cols-2"
        variants={staggerContainerSlow}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
      >
        {rest.map((project, i) => (
          <Card key={project.title} project={project} index={i + 1} />
        ))}
      </motion.div>
    </Section>
  );
}
