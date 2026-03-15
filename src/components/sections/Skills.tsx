import { useRef, useEffect, useCallback, useState } from "react";
import { motion } from "framer-motion";
import Section from "../layout/Section";
import SectionHeading from "../ui/SectionHeading";
import { skills } from "../../constants/data";
import { fadeInUp, viewportConfig } from "../../lib/animations";

interface Point3D {
  x: number;
  y: number;
  z: number;
}

/* ── Space Background Types ── */
interface Star {
  x: number; // 0-1 normalized
  y: number;
  size: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  layer: number; // 0=far, 1=mid, 2=near — controls parallax strength
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  length: number;
}

interface Nebula {
  x: number; // 0-1
  y: number;
  radius: number;
  color: string; // rgba
}

function generateStars(count: number): Star[] {
  const stars: Star[] = [];
  const layerDistribution = [0.5, 0.3, 0.2]; // far, mid, near
  const sizes = [1, 1.5, 2.5];
  const alphas = [0.4, 0.6, 0.85];
  const speeds = [0.8, 1.2, 1.8];

  for (let layer = 0; layer < 3; layer++) {
    const n = Math.floor(count * layerDistribution[layer]);
    for (let i = 0; i < n; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: sizes[layer] + Math.random() * 0.5,
        baseAlpha: alphas[layer] * (0.6 + Math.random() * 0.4),
        twinkleSpeed: speeds[layer] * (0.7 + Math.random() * 0.6),
        twinkleOffset: Math.random() * Math.PI * 2,
        layer,
      });
    }
  }
  return stars;
}

function generateNebulae(): Nebula[] {
  return [
    { x: 0.12, y: 0.15, radius: 0.25, color: "rgba(34, 211, 238, 0.04)" },  // cyan top-left
    { x: 0.85, y: 0.80, radius: 0.30, color: "rgba(167, 139, 250, 0.045)" }, // purple bottom-right
    { x: 0.75, y: 0.10, radius: 0.18, color: "rgba(167, 139, 250, 0.03)" },  // faint purple top-right
  ];
}

function createShootingStar(w: number, h: number): ShootingStar {
  // Start from a random edge
  const side = Math.random();
  let x: number, y: number;
  if (side < 0.5) {
    x = Math.random() * w;
    y = -10;
  } else {
    x = side < 0.75 ? -10 : w + 10;
    y = Math.random() * h * 0.5;
  }

  const angle = Math.PI * 0.15 + Math.random() * Math.PI * 0.3; // roughly diagonal
  const speed = 4 + Math.random() * 4;

  return {
    x,
    y,
    vx: Math.cos(angle) * speed * (x > w / 2 ? -1 : 1),
    vy: Math.sin(angle) * speed,
    life: 0,
    maxLife: 60 + Math.random() * 40,
    length: 40 + Math.random() * 60,
  };
}

function drawSpaceBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  stars: Star[],
  nebulae: Nebula[],
  shootingStars: ShootingStar[],
  time: number,
  parallaxX: number,
  parallaxY: number
) {
  // Don't clear — the wireframe canvas handles that; this canvas is separate

  // ── Nebulae (soft radial gradient blobs) ──
  for (const neb of nebulae) {
    const nx = neb.x * w;
    const ny = neb.y * h;
    const nr = neb.radius * Math.max(w, h);
    // Slow drift
    const dx = Math.sin(time * 0.0003 + neb.x * 10) * 15;
    const dy = Math.cos(time * 0.0002 + neb.y * 10) * 10;
    const grad = ctx.createRadialGradient(nx + dx, ny + dy, 0, nx + dx, ny + dy, nr);
    grad.addColorStop(0, neb.color);
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  // ── Stars with parallax + twinkle ──
  const parallaxStrengths = [2, 6, 12]; // pixels of shift per layer
  for (const star of stars) {
    const px = parallaxX * parallaxStrengths[star.layer];
    const py = parallaxY * parallaxStrengths[star.layer];
    const sx = ((star.x * w + px) % w + w) % w;
    const sy = ((star.y * h + py) % h + h) % h;

    const twinkle = 0.5 + 0.5 * Math.sin(time * 0.001 * star.twinkleSpeed + star.twinkleOffset);
    const alpha = star.baseAlpha * (0.3 + twinkle * 0.7);

    ctx.beginPath();
    ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fill();

    // Near stars get a subtle glow
    if (star.layer === 2 && twinkle > 0.7) {
      ctx.beginPath();
      ctx.arc(sx, sy, star.size * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.12})`;
      ctx.fill();
    }
  }

  // ── Shooting stars ──
  for (const ss of shootingStars) {
    if (ss.life >= ss.maxLife) continue;
    const progress = ss.life / ss.maxLife;
    const fade = progress < 0.1 ? progress / 0.1 : progress > 0.7 ? (1 - progress) / 0.3 : 1;
    const alpha = fade * 0.8;

    const tailX = ss.x - (ss.vx / Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy)) * ss.length * fade;
    const tailY = ss.y - (ss.vy / Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy)) * ss.length * fade;

    const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
    grad.addColorStop(0, `rgba(255, 255, 255, 0)`);
    grad.addColorStop(0.6, `rgba(200, 220, 255, ${alpha * 0.3})`);
    grad.addColorStop(1, `rgba(255, 255, 255, ${alpha})`);

    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(ss.x, ss.y);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Bright head
    ctx.beginPath();
    ctx.arc(ss.x, ss.y, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fill();
  }
}

const PERSPECTIVE = 600;
const BASE_POINTS = fibonacciSphere(skills.length);

const SKILL_COLORS: Record<string, string> = {
  Python: "#3776AB",
  C: "#A8B9CC",
  "C++": "#00599C",
  JavaScript: "#F7DF1E",
  TypeScript: "#3178C6",
  HTML5: "#E34F26",
  CSS3: "#1572B6",
  Bash: "#4EAA25",
  FastAPI: "#009688",
  React: "#61DAFB",
  "Node.js": "#339933",
  Pandas: "#150458",
  NumPy: "#013243",
  PyTorch: "#EE4C2C",
  "Scikit-learn": "#F7931E",
  OpenAI: "#412991",
  TensorFlow: "#FF6F00",
  MySQL: "#4479A1",
  PostgreSQL: "#4169E1",
  Docker: "#2496ED",
  Git: "#F05032",
  Linux: "#FCC624",
  Jupyter: "#F37626",
  Postman: "#FF6C37",
  "Google Cloud": "#4285F4",
};

// Fibonacci sphere for even point distribution
function fibonacciSphere(n: number): Point3D[] {
  const points: Point3D[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    points.push({
      x: Math.cos(theta) * radius,
      y,
      z: Math.sin(theta) * radius,
    });
  }
  return points;
}

function rotateY(p: Point3D, angle: number): Point3D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: p.x * cos + p.z * sin, y: p.y, z: -p.x * sin + p.z * cos };
}

function rotateX(p: Point3D, angle: number): Point3D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: p.x, y: p.y * cos - p.z * sin, z: p.y * sin + p.z * cos };
}

function drawWireframe(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  radius: number,
  rY: number,
  rX: number
) {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2;

  ctx.strokeStyle = "rgba(255, 255, 255, 0.045)";
  ctx.lineWidth = 1;

  const segments = 36;

  // Latitude lines
  for (let lat = -2; lat <= 2; lat++) {
    const phi = (lat / 3) * (Math.PI / 2);
    const r = Math.cos(phi) * radius;
    const yOff = Math.sin(phi) * radius;
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      let p: Point3D = { x: Math.cos(theta) * r, y: yOff, z: Math.sin(theta) * r };
      p = rotateY(p, rY);
      p = rotateX(p, rX);
      const s = PERSPECTIVE / (PERSPECTIVE + p.z);
      const sx = cx + p.x * s;
      const sy = cy + p.y * s;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }

  // Longitude lines
  for (let lon = 0; lon < 6; lon++) {
    const theta = (lon / 6) * Math.PI * 2;
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const phi = (i / segments) * Math.PI * 2;
      let p: Point3D = {
        x: Math.cos(theta) * Math.cos(phi) * radius,
        y: Math.sin(phi) * radius,
        z: Math.sin(theta) * Math.cos(phi) * radius,
      };
      p = rotateY(p, rY);
      p = rotateX(p, rX);
      const s = PERSPECTIVE / (PERSPECTIVE + p.z);
      const sx = cx + p.x * s;
      const sy = cy + p.y * s;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }
}

interface SkillPos {
  x: number;
  y: number;
  depthNorm: number;
}

export default function Skills() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spaceCanvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const rotationRef = useRef({ y: 0, x: 0 });
  const velocityRef = useRef({ y: 0.003, x: 0.001 });
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const sphereRadius = useRef(200);
  const isMobileRef = useRef(false);

  // Space background refs
  const starsRef = useRef<Star[]>([]);
  const nebulaeRef = useRef<Nebula[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const shootingStarTimer = useRef(0);
  const timeRef = useRef(0);
  const spaceSizeRef = useRef({ w: 0, h: 0 });

  const [positions, setPositions] = useState<SkillPos[]>([]);

  const updateRadius = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const minDim = Math.min(rect.width, rect.height);
    isMobileRef.current = rect.width < 640;
    sphereRadius.current = minDim * (isMobileRef.current ? 0.42 : 0.36);
  }, []);

  // Pointer handlers
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    velocityRef.current.y = dx * 0.004;
    velocityRef.current.x = dy * 0.004;
    lastPointer.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    updateRadius();

    const canvas = canvasRef.current;
    const spaceCanvas = spaceCanvasRef.current;
    const container = containerRef.current;

    if (canvas && container) {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    // Size space canvas explicitly — use the section element (motion.section parent)
    const dpr = window.devicePixelRatio || 1;
    function sizeSpaceCanvas() {
      if (!spaceCanvas) return;
      // Find the motion.section element (Section wrapper with id="skills")
      const sectionEl = spaceCanvas.closest("section");
      if (!sectionEl) return;
      const sectionRect = sectionEl.getBoundingClientRect();
      const cssW = sectionRect.width;
      const cssH = sectionRect.height;

      // Position canvas to cover the full section (including padding)
      // sectionRef is inside max-w-5xl which is inside the section's padding
      const sectionRefRect = sectionRef.current?.getBoundingClientRect();
      if (sectionRefRect) {
        const offsetTop = sectionRect.top - sectionRefRect.top;
        spaceCanvas.style.top = `${offsetTop}px`;
      }
      spaceCanvas.style.width = `${cssW}px`;
      spaceCanvas.style.height = `${cssH}px`;

      spaceSizeRef.current = { w: cssW, h: cssH };
      spaceCanvas.width = cssW * dpr;
      spaceCanvas.height = cssH * dpr;
      const ctx = spaceCanvas.getContext("2d");
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    sizeSpaceCanvas();

    // ResizeObserver catches layout settling after mount
    const sectionEl = spaceCanvas?.closest("section");
    const spaceRo = sectionEl ? new ResizeObserver(() => sizeSpaceCanvas()) : null;
    if (sectionEl) spaceRo?.observe(sectionEl);

    // Generate stars — fewer on mobile
    const isMobile = window.innerWidth < 768;
    const starCount = isMobile ? 100 : 220;
    starsRef.current = generateStars(starCount);
    nebulaeRef.current = generateNebulae();
    shootingStarsRef.current = [];
    shootingStarTimer.current = 0;

    function tick() {
      const rot = rotationRef.current;
      const vel = velocityRef.current;

      if (!isDragging.current) {
        vel.y += (0.003 - vel.y) * 0.005;
        vel.x += (0.0005 - vel.x) * 0.005;
      }

      rot.y += vel.y;
      rot.x += vel.x;
      timeRef.current++;

      const r = sphereRadius.current;
      const newPositions: SkillPos[] = BASE_POINTS.map((bp) => {
        let p = { x: bp.x * r, y: bp.y * r, z: bp.z * r };
        p = rotateY(p, rot.y);
        p = rotateX(p, rot.x);
        const scale = PERSPECTIVE / (PERSPECTIVE + p.z);
        const depthNorm = (p.z + r) / (2 * r);
        return { x: p.x * scale, y: p.y * scale, depthNorm };
      });

      setPositions(newPositions);

      // ── Wireframe canvas ──
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          drawWireframe(ctx, canvas.width, canvas.height, r, rot.y, rot.x);
        }
      }

      // ── Space background canvas ──
      if (spaceCanvas) {
        const sCtx = spaceCanvas.getContext("2d");
        if (sCtx) {
          // Use clientWidth/Height for accurate dimensions (never stale)
          const sw = spaceCanvas.clientWidth || spaceSizeRef.current.w;
          const sh = spaceCanvas.clientHeight || spaceSizeRef.current.h;
          sCtx.clearRect(0, 0, sw, sh);

          // Parallax from rotation (normalized -1 to 1 range, wrapping)
          const parallaxX = Math.sin(rot.y) * 1;
          const parallaxY = Math.sin(rot.x) * 1;

          // Manage shooting stars
          shootingStarTimer.current++;
          const spawnInterval = isMobile ? 360 : 240; // ~4s at 60fps, longer on mobile
          if (shootingStarTimer.current >= spawnInterval) {
            shootingStarTimer.current = 0;
            shootingStarsRef.current.push(createShootingStar(sw, sh));
          }

          // Update shooting stars
          for (const ss of shootingStarsRef.current) {
            ss.x += ss.vx;
            ss.y += ss.vy;
            ss.life++;
          }
          // Remove dead ones
          shootingStarsRef.current = shootingStarsRef.current.filter(
            (ss) => ss.life < ss.maxLife
          );

          drawSpaceBackground(
            sCtx, sw, sh,
            starsRef.current,
            nebulaeRef.current,
            shootingStarsRef.current,
            timeRef.current,
            parallaxX,
            parallaxY
          );
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    const onResize = () => {
      updateRadius();
      if (canvas && container) {
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
      sizeSpaceCanvas();
      // Regenerate stars for new viewport
      const mobile = window.innerWidth < 768;
      starsRef.current = generateStars(mobile ? 100 : 220);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      spaceRo?.disconnect();
    };
  }, [updateRadius]);

  return (
    <Section id="skills">
      <div
        ref={sectionRef}
        className="relative"
      >
        {/* Space background canvas — sized explicitly via JS to cover full section */}
        <canvas
          ref={spaceCanvasRef}
          className="absolute pointer-events-none"
          style={{
            zIndex: 0,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />

        <div className="relative" style={{ zIndex: 1 }}>
          <SectionHeading title="Skills" subtitle="Technologies I work with" />

          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
          >
            <div
              ref={containerRef}
              className="relative mx-auto h-[420px] w-full max-w-[600px] cursor-grab select-none touch-none active:cursor-grabbing md:h-[520px]"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            >
              <canvas
                ref={canvasRef}
                className="absolute inset-0 h-full w-full"
              />

              <div className="absolute inset-0">
                {positions.map((pos, i) => {
                  const skill = skills[i];
                  const Icon = skill.icon;
                  const opacity = 0.2 + pos.depthNorm * 0.8;
                  const mobile = isMobileRef.current;
                  const iconSize = mobile
                    ? 16 + pos.depthNorm * 14
                    : 20 + pos.depthNorm * 20;

                  return (
                    <div
                      key={skill.name}
                      className="absolute left-1/2 top-1/2 flex flex-col items-center gap-1 pointer-events-none"
                      style={{
                        transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px)`,
                        opacity,
                        zIndex: Math.round(pos.depthNorm * 100),
                      }}
                    >
                      <Icon size={iconSize} color={SKILL_COLORS[skill.name]} />
                      <span
                        className="font-mono text-text-secondary whitespace-nowrap"
                        style={{ fontSize: `${mobile ? 7 + pos.depthNorm * 3 : 8 + pos.depthNorm * 4}px` }}
                      >
                        {skill.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="mt-4 text-center font-mono text-xs tracking-widest text-text-secondary/50 uppercase">
              Drag to explore
            </p>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}
