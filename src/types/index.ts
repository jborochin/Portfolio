export interface Project {
  title: string;
  description: string;
  tech: string[];
  github?: string;
  live?: string;
  accent?: string;
}

export interface Experience {
  company: string;
  role: string;
  period: string;
}

export interface SkillCategory {
  category: string;
  skills: string[];
}

export interface Skill {
  name: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface Social {
  label: string;
  href: string;
  icon: "github" | "linkedin" | "email";
}

export interface Stat {
  value: string;
  label: string;
}
