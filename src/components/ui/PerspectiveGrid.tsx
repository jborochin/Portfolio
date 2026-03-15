import { useEffect, useRef } from "react";
import { useScroll, useTransform, useMotionValueEvent } from "framer-motion";

interface Pulse {
  lineIndex: number;
  progress: number; // 0→1
  speed: number;
  type: "horizontal" | "vertical";
  length: number; // px length of the bright segment
}

export default function PerspectiveGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const opacityRef = useRef(1);
  const pulsesRef = useRef<Pulse[]>([]);
  const lastSpawnRef = useRef(0);
  const animFrameRef = useRef(0);

  // Scroll-based fade
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, window.innerHeight * 0.8], [1, 0]);

  useMotionValueEvent(opacity, "change", (v) => {
    opacityRef.current = Math.max(0, v);
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const DPR = Math.min(window.devicePixelRatio, 1.5);

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width * DPR;
      canvas!.height = height * DPR;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(document.documentElement);
    resize();

    function getGridConfig() {
      if (width < 480) return { hLines: 10, vLines: 8, pulsesEnabled: false, maxPulses: 0 };
      if (width < 768) return { hLines: 14, vLines: 10, pulsesEnabled: true, maxPulses: 3 };
      return { hLines: 24, vLines: 18, pulsesEnabled: true, maxPulses: 5 };
    }

    function draw(time: number) {
      animFrameRef.current = requestAnimationFrame(draw);

      const op = opacityRef.current;
      if (op <= 0) {
        canvas!.style.opacity = "0";
        return;
      }
      canvas!.style.opacity = String(op);

      ctx!.clearRect(0, 0, width, height);

      const config = getGridConfig();
      const vpX = width * 0.5;
      const vpY = height * 0.38;

      // Bottom edge Y (extend slightly past viewport for clean edges)
      const bottomY = height * 1.05;
      const gridHeight = bottomY - vpY;

      // --- Horizontal lines (quadratic spacing) ---
      const hLineYs: number[] = [];
      for (let i = 0; i < config.hLines; i++) {
        const t = i / (config.hLines - 1); // 0→1
        const y = vpY + gridHeight * (t * t); // quadratic: dense near VP
        hLineYs.push(y);
      }

      // Width of the grid at a given Y (fans out from vanishing point)
      function gridHalfWidth(y: number) {
        const t = (y - vpY) / gridHeight;
        return width * 0.7 * t; // fans out to 70% of screen width at bottom
      }

      // Draw horizontal lines
      for (let i = 0; i < hLineYs.length; i++) {
        const y = hLineYs[i];
        const t = (y - vpY) / gridHeight;
        const alpha = 0.06 + t * 0.16; // 0.06 distant → 0.22 close
        const hw = gridHalfWidth(y);

        ctx!.beginPath();
        ctx!.moveTo(vpX - hw, y);
        ctx!.lineTo(vpX + hw, y);
        ctx!.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
        ctx!.lineWidth = 0.6 + t * 0.6;

        // Subtle glow on every 4th line
        if (i % 4 === 0 && i > 0) {
          ctx!.shadowColor = "rgba(34, 211, 238, 0.3)";
          ctx!.shadowBlur = 4;
        } else {
          ctx!.shadowBlur = 0;
        }
        ctx!.stroke();
      }
      ctx!.shadowBlur = 0;

      // --- Vertical lines (fan from vanishing point to bottom) ---
      const vLineAngles: number[] = [];
      const fanSpread = 1.2; // radians, total spread
      for (let i = 0; i < config.vLines; i++) {
        const t = i / (config.vLines - 1); // 0→1
        const angle = -fanSpread / 2 + fanSpread * t;
        vLineAngles.push(angle);
      }

      for (let i = 0; i < vLineAngles.length; i++) {
        const angle = vLineAngles[i];
        // Calculate where this line hits the bottom edge
        const dx = Math.tan(angle) * gridHeight;
        const endX = vpX + dx;
        const endY = bottomY;

        const t = Math.abs(angle) / (fanSpread / 2); // 0 at center → 1 at edges
        const alpha = 0.18 - t * 0.1; // brighter at center

        ctx!.beginPath();
        ctx!.moveTo(vpX, vpY);
        ctx!.lineTo(endX, endY);
        ctx!.strokeStyle = `rgba(34, 211, 238, ${Math.max(0.05, alpha)})`;
        ctx!.lineWidth = 0.5;

        // Glow on center line and every 6th
        if (i === Math.floor(config.vLines / 2) || i % 6 === 0) {
          ctx!.shadowColor = "rgba(34, 211, 238, 0.25)";
          ctx!.shadowBlur = 4;
        } else {
          ctx!.shadowBlur = 0;
        }
        ctx!.stroke();
      }
      ctx!.shadowBlur = 0;

      // --- Energy Pulses ---
      if (config.pulsesEnabled) {
        const spawnInterval = width < 768 ? 3000 : 1500 + Math.random() * 1500;
        if (
          time - lastSpawnRef.current > spawnInterval &&
          pulsesRef.current.length < config.maxPulses
        ) {
          lastSpawnRef.current = time;
          const isHorizontal = Math.random() > 0.4;
          if (isHorizontal) {
            // Pick a horizontal line (skip the first few near VP)
            const idx = Math.floor(3 + Math.random() * (hLineYs.length - 4));
            pulsesRef.current.push({
              lineIndex: idx,
              progress: 0,
              speed: 0.3 + Math.random() * 0.4,
              type: "horizontal",
              length: 30 + Math.random() * 30,
            });
          } else {
            const idx = Math.floor(Math.random() * vLineAngles.length);
            pulsesRef.current.push({
              lineIndex: idx,
              progress: 0,
              speed: 0.2 + Math.random() * 0.3,
              type: "vertical",
              length: 20 + Math.random() * 40,
            });
          }
        }

        // Update + draw pulses
        const dt = 1 / 60; // approximate
        pulsesRef.current = pulsesRef.current.filter((p) => {
          p.progress += p.speed * dt;
          if (p.progress > 1) return false;

          // Fade in/out at endpoints
          const fadeIn = Math.min(p.progress / 0.1, 1);
          const fadeOut = Math.min((1 - p.progress) / 0.1, 1);
          const pulseAlpha = fadeIn * fadeOut;

          ctx!.save();
          ctx!.shadowColor = "rgba(34, 211, 238, 0.7)";
          ctx!.shadowBlur = 12;
          ctx!.lineCap = "round";

          if (p.type === "horizontal") {
            const y = hLineYs[p.lineIndex];
            if (y === undefined) return false;
            const hw = gridHalfWidth(y);
            const totalLen = hw * 2;
            const startX = vpX - hw + totalLen * p.progress;
            const segLen = Math.min(p.length, totalLen * (1 - p.progress));

            ctx!.beginPath();
            ctx!.moveTo(startX, y);
            ctx!.lineTo(startX + segLen, y);
            ctx!.strokeStyle = `rgba(34, 211, 238, ${0.6 * pulseAlpha})`;
            ctx!.lineWidth = 1.5;
            ctx!.stroke();
          } else {
            const angle = vLineAngles[p.lineIndex];
            if (angle === undefined) return false;
            const dx = Math.tan(angle) * gridHeight;
            const t1 = p.progress;
            const t2 = Math.min(p.progress + p.length / (gridHeight * 1.2), 1);

            const x1 = vpX + dx * t1;
            const y1 = vpY + gridHeight * t1;
            const x2 = vpX + dx * t2;
            const y2 = vpY + gridHeight * t2;

            ctx!.beginPath();
            ctx!.moveTo(x1, y1);
            ctx!.lineTo(x2, y2);
            ctx!.strokeStyle = `rgba(34, 211, 238, ${0.55 * pulseAlpha})`;
            ctx!.lineWidth = 1.2;
            ctx!.stroke();
          }

          ctx!.restore();
          return true;
        });
      }
    }

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
