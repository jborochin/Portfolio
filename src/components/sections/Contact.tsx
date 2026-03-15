import { FiGithub, FiLinkedin, FiMail } from "react-icons/fi";
import Section from "../layout/Section";
import Button from "../ui/Button";
import { socials } from "../../constants/data";

const iconMap = {
  github: FiGithub,
  linkedin: FiLinkedin,
  email: FiMail,
};

export default function Contact() {
  return (
    <Section id="contact" className="bg-bg-secondary">
      <div className="mx-auto max-w-md text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight text-text-heading md:text-4xl">
          Let's Connect
        </h2>
        <div className="mx-auto mt-4 h-1 w-12 rounded-full bg-gradient-to-r from-accent to-secondary" />
        <p className="mt-6 text-text-secondary">
          I'm always open to discussing new opportunities, interesting projects, or just chatting about tech.
        </p>

        <div className="mt-8">
          <Button href="mailto:jborochin@gmail.com">
            <FiMail size={18} />
            Say Hello
          </Button>
        </div>

        <div className="mt-8 flex justify-center gap-6">
          {socials.map((s) => {
            const Icon = iconMap[s.icon];
            return (
              <a
                key={s.label}
                href={s.href}
                target={s.icon !== "email" ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="text-text-secondary transition-colors hover:text-accent"
                aria-label={s.label}
              >
                <Icon size={24} />
              </a>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
