import type { Project, Experience, SkillCategory, NavLink, Social, Stat, Skill } from "../types";
import {
  SiPython, SiC, SiCplusplus, SiJavascript, SiTypescript,
  SiHtml5, SiCss, SiGnubash, SiFastapi, SiReact, SiNodedotjs,
  SiPandas, SiNumpy, SiPytorch, SiScikitlearn, SiOpenai, SiTensorflow,
  SiMysql, SiPostgresql, SiDocker, SiGit,
  SiLinux, SiJupyter, SiPostman, SiGooglecloud,
} from "react-icons/si";

export const navLinks: NavLink[] = [
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Contact", href: "#contact" },
];

export const socials: Social[] = [
  { label: "GitHub", href: "https://github.com/jborochin", icon: "github" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/jason-borochin-143554290/", icon: "linkedin" },
  { label: "Email", href: "mailto:jborochin@gmail.com", icon: "email" },
];

export const stats: Stat[] = [
  { value: "3.77", label: "GPA" },
  { value: "2", label: "Internships" },
  { value: "5+", label: "Projects" },
];

export const bio =
  "I'm a Computer Engineering student at the University of Illinois at Urbana-Champaign with a passion for building software that solves real problems. From full-stack web applications to machine learning systems and hardware-accelerated computing, I enjoy working across the entire stack. I thrive in fast-paced environments where I can learn quickly, ship often, and collaborate with talented teams.";

export const education = {
  degree: "B.S. Computer Engineering",
  minor: "Minor in Business",
  school: "University of Illinois at Urbana-Champaign",
  gpa: "3.77 / 4.00",
  expected: "Expected May 2027",
  clubs: ["IEEE @ Illinois", "ACM @ UIUC"],
};

export const skillCategories: SkillCategory[] = [
  {
    category: "Languages",
    skills: [
      "Python", "C", "C++", "JavaScript", "TypeScript", "SQL",
      "HTML5", "CSS3", "Bash", "RISC-V Assembly", "SystemVerilog",
    ],
  },
  {
    category: "Frameworks & Libraries",
    skills: [
      "FastAPI", "React", "Node.js", "Pandas", "NumPy",
      "PyTorch", "Scikit-learn", "OpenAI API", "TensorFlow",
    ],
  },
  {
    category: "Databases",
    skills: ["MySQL", "PostgreSQL", "NoSQL"],
  },
  {
    category: "Tools & Platforms",
    skills: [
      "Docker", "Git", "Azure", "AWS", "Linux/Unix",
      "Jupyter", "Postman", "Cursor", "Claude Code", "GCP",
    ],
  },
  {
    category: "Concepts",
    skills: ["CI/CD", "REST APIs", "GenAI APIs", "OAuth2/JWT", "OOP", "ML", "RAG", "MCP"],
  },
];

export const skills: Skill[] = [
  { name: "Python", icon: SiPython },
  { name: "C", icon: SiC },
  { name: "C++", icon: SiCplusplus },
  { name: "JavaScript", icon: SiJavascript },
  { name: "TypeScript", icon: SiTypescript },
  { name: "HTML5", icon: SiHtml5 },
  { name: "CSS3", icon: SiCss },
  { name: "Bash", icon: SiGnubash },
  { name: "FastAPI", icon: SiFastapi },
  { name: "React", icon: SiReact },
  { name: "Node.js", icon: SiNodedotjs },
  { name: "Pandas", icon: SiPandas },
  { name: "NumPy", icon: SiNumpy },
  { name: "PyTorch", icon: SiPytorch },
  { name: "Scikit-learn", icon: SiScikitlearn },
  { name: "OpenAI", icon: SiOpenai },
  { name: "TensorFlow", icon: SiTensorflow },
  { name: "MySQL", icon: SiMysql },
  { name: "PostgreSQL", icon: SiPostgresql },
  { name: "Docker", icon: SiDocker },
  { name: "Git", icon: SiGit },
  { name: "Linux", icon: SiLinux },
  { name: "Jupyter", icon: SiJupyter },
  { name: "Postman", icon: SiPostman },
  { name: "Google Cloud", icon: SiGooglecloud },
];

export const experiences: Experience[] = [
  {
    company: "KnowledgeTech, LLC",
    role: "Software Engineering Intern",
    period: "Jun – Aug 2025"
  },
  {
    company: "StellaLife, Inc",
    role: "Data Intern",
    period: "Jun – Oct 2024"
  },
];

export const projects: Project[] = [
  {
    title: "Automated Academic Scheduler",
    description:
      "An AI-powered scheduling tool that parses course requirements and generates optimized academic plans, automatically syncing events to Google Calendar.",
    tech: ["Python", "Claude Code", "Google Calendar API"],
    github: "https://github.com/jborochin/academic-scheduler",
    accent: "#22d3ee",
  },
  {
    title: "Deep Learning Autograd Engine",
    description:
      "A from-scratch automatic differentiation engine supporting forward and backward passes, enabling gradient computation for custom neural network architectures.",
    tech: ["Python", "NumPy"],
    github: "https://github.com/jborochin/autograd-engine",
    accent: "#f59e0b",
  },
  {
    title: "Infographic Recipe Generator",
    description:
      "A web app that generates visually rich infographic-style recipes from user prompts using Google's Gemini API for content generation.",
    tech: ["React", "Node.js", "Gemini API", "Vite"],
    github: "https://github.com/jborochin/Recipe-Infographic-Generator",
    accent: "#34d399",
  },
  {
    title: "Handwritten Digit Recognition System",
    description:
      "An end-to-end digit recognition pipeline combining a PyTorch-trained CNN with a SystemVerilog hardware accelerator deployed on an FPGA.",
    tech: ["PyTorch", "SystemVerilog", "FPGA"],
    github: "https://github.com/jborochin/Handwritten-FPGA-Digit-Recognizer",
    accent: "#f472b6",
  },
  {
    title: "Credit Card Fraud Detection",
    description:
      "A full-stack fraud detection system with a FastAPI backend serving ML predictions, a React dashboard for analysts, and PostgreSQL for transaction storage.",
    tech: ["Python", "FastAPI", "React", "PostgreSQL", "Docker"],
    github: "https://github.com/jborochin/Credit-Card-Fraud-Detection",
    accent: "#818cf8",
  },
];
