import { FiGithub, FiLinkedin, FiMail } from "react-icons/fi";
import { socials } from "../../constants/data";

const iconMap = {
  github: FiGithub,
  linkedin: FiLinkedin,
  email: FiMail,
};

export default function Footer() {
  return (
    <footer className="border-t border-border bg-bg-secondary px-6 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 md:flex-row md:justify-between">
        <p className="text-sm text-text-secondary">
          &copy; {new Date().getFullYear()} Jason Borochin
        </p>
        <div className="flex gap-4">
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
                <Icon size={20} />
              </a>
            );
          })}
        </div>
      </div>
    </footer>
  );
}
