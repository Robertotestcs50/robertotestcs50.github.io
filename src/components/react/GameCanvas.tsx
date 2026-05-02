import { useRef, useEffect, useState, useCallback } from 'react';
import { useReducedMotion } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

type ObstacleType = 'figma' | 'powerbi' | 'laptop' | 'coffee';

interface Player {
  x: number;
  y: number;
  vy: number;
  onGround: boolean;
  frame: number;       // 0–15, controls leg animation
  dead: boolean;
  deadTimer: number;
  angle: number;       // tilt on death
}

interface Obstacle {
  type: ObstacleType;
  x: number;
  y: number;
  w: number;
  h: number;
  angle: number;       // coffee cup rotation
  laptopAngle: number; // lid angle
  pulseT: number;      // figma pulse phase
}

interface BuildingLayer {
  rects: { x: number; w: number; h: number }[];
  speed: number;
  color: string;
}

interface Star {
  x: number;
  y: number;
  r: number;
}

// ─── useGameLoop ──────────────────────────────────────────────────────────────

function useGameLoop(callback: (dt: number) => void, running: boolean) {
  const cbRef = useRef(callback);
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);

  useEffect(() => { cbRef.current = callback; }, [callback]);

  useEffect(() => {
    if (!running) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    lastRef.current = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(now - lastRef.current, 50); // cap at 50ms
      lastRef.current = now;
      cbRef.current(dt);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running]);
}

// ─── Drawing helpers ──────────────────────────────────────────────────────────

const GROUND_OFFSET = 40;
const PLAYER_X = 80;
const PLAYER_W = 14;
const PLAYER_H = 20;
const HEAD_R = 7;
const GRAVITY = 0.6;
const JUMP_V = -13;
const INSET = 4;

function groundY(canvasH: number) {
  return canvasH - GROUND_OFFSET;
}

function playerGroundY(canvasH: number) {
  return groundY(canvasH) - PLAYER_H;
}

function drawPlayer(ctx: CanvasRenderingContext2D, p: Player, canvasH: number) {
  ctx.save();

  const cx = p.x + PLAYER_W / 2;
  const cy = p.y + PLAYER_H / 2 + HEAD_R;

  // Glow
  ctx.shadowBlur = 20;
  ctx.shadowColor = p.dead ? '#FF2020' : '#C8E6FF';

  if (p.dead) {
    ctx.translate(cx, p.y + PLAYER_H);
    ctx.rotate((45 * Math.PI) / 180);
    ctx.translate(-PLAYER_W / 2, -PLAYER_H);
  } else {
    ctx.translate(0, 0);
  }

  // Body
  ctx.fillStyle = '#FAFAFA';
  ctx.fillRect(p.dead ? 0 : p.x, p.dead ? 0 : p.y, PLAYER_W, PLAYER_H);

  // Head
  ctx.beginPath();
  ctx.arc(
    p.dead ? PLAYER_W / 2 : p.x + PLAYER_W / 2,
    p.dead ? -HEAD_R : p.y - HEAD_R,
    HEAD_R,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Legs (only when alive)
  if (!p.dead) {
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#FAFAFA';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    const gY = groundY(canvasH);
    const legFrame = Math.floor(p.frame / 8) % 2;
    const lx = p.x + PLAYER_W / 2;
    const topY = p.y + PLAYER_H;

    // Left leg
    ctx.beginPath();
    ctx.moveTo(lx - 3, topY);
    ctx.lineTo(lx - 3 + (legFrame === 0 ? -5 : 5), gY);
    ctx.stroke();

    // Right leg
    ctx.beginPath();
    ctx.moveTo(lx + 3, topY);
    ctx.lineTo(lx + 3 + (legFrame === 0 ? 5 : -5), gY);
    ctx.stroke();
  }

  ctx.restore();
}

function drawObstacle(ctx: CanvasRenderingContext2D, obs: Obstacle, canvasH: number) {
  ctx.save();
  ctx.shadowBlur = 0;

  const gY = groundY(canvasH);

  switch (obs.type) {
    case 'figma': {
      const scale = 1 + 0.05 * Math.sin(obs.pulseT * 0.1);
      ctx.translate(obs.x + obs.w / 2, obs.y + obs.h / 2);
      ctx.scale(scale, scale);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-obs.w / 2, -obs.h / 2, obs.w, obs.h);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '10px "Geist Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('F', 0, 0);
      break;
    }

    case 'powerbi': {
      const barW = 6;
      const heights = [8, 14, 10];
      const totalW = barW * 3 + 4;
      let bx = obs.x;
      ctx.fillStyle = 'rgba(200,230,255,0.7)';
      heights.forEach((bh, i) => {
        ctx.fillRect(bx + i * (barW + 2), gY - bh, barW, bh);
      });
      break;
    }

    case 'laptop': {
      // Base
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillRect(obs.x, gY - 4, 32, 4);

      // Lid — animates from open to closed as it travels
      const lidAngle = obs.laptopAngle;
      ctx.save();
      ctx.translate(obs.x + 4, gY - 4); // hinge point
      ctx.rotate(-lidAngle);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillRect(0, -20, 28, 20);
      ctx.restore();
      break;
    }

    case 'coffee': {
      ctx.save();
      ctx.translate(obs.x + 8, gY - 9);
      ctx.rotate(obs.angle);

      // Trapezoid body
      ctx.beginPath();
      ctx.moveTo(-5, -9);  // top-left
      ctx.lineTo(5, -9);   // top-right
      ctx.lineTo(8, 9);    // bottom-right
      ctx.lineTo(-8, 9);   // bottom-left
      ctx.closePath();
      ctx.fillStyle = '#C8E6FF';
      ctx.fill();

      // Handle arc
      ctx.strokeStyle = '#C8E6FF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(9, 0, 5, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();

      ctx.restore();
      break;
    }
  }

  ctx.restore();
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  layers: BuildingLayer[],
  stars: Star[],
  canvasW: number,
  canvasH: number
) {
  const gY = groundY(canvasH);

  // Stars (fixed)
  stars.forEach((s) => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fill();
  });

  // Building layers
  layers.forEach((layer) => {
    ctx.fillStyle = layer.color;
    layer.rects.forEach((r) => {
      ctx.fillRect(r.x, gY - r.h, r.w, r.h);
    });
  });
}

function drawHUD(
  ctx: CanvasRenderingContext2D,
  score: number,
  best: number,
  flash: boolean,
  canvasW: number
) {
  ctx.font = '12px "Geist Mono", monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'right';

  const scoreText = `${score.toLocaleString()} m`;
  const bestText = `BEST  ${best.toLocaleString()} m`;

  ctx.fillStyle = flash ? '#FAFAFA' : '#C8E6FF';
  ctx.fillText(scoreText, canvasW - 16, 14);

  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillText(bestText, canvasW - 16, 30);
}

// ─── Building layer factory ───────────────────────────────────────────────────

function makeLayers(canvasW: number, canvasH: number, speed: number): BuildingLayer[] {
  const configs = [
    { speedMul: 0.15, color: 'rgba(255,255,255,0.03)', minH: 60, maxH: 140, spacing: 80, w: 18 },
    { speedMul: 0.35, color: 'rgba(255,255,255,0.05)', minH: 30, maxH: 80,  spacing: 60, w: 24 },
    { speedMul: 0.6,  color: 'rgba(255,255,255,0.07)', minH: 10, maxH: 30,  spacing: 50, w: 32 },
  ];

  return configs.map((c) => {
    const rects: { x: number; w: number; h: number }[] = [];
    let x = 0;
    while (x < canvasW + c.w * 2) {
      rects.push({
        x,
        w: c.w,
        h: c.minH + Math.random() * (c.maxH - c.minH),
      });
      x += c.w + c.spacing + Math.random() * 20;
    }
    return { rects, speed: speed * c.speedMul, color: c.color };
  });
}

function makeStars(canvasW: number, canvasH: number): Star[] {
  return Array.from({ length: 30 }, () => ({
    x: Math.random() * canvasW,
    y: Math.random() * canvasH * 0.6,
    r: 0.5 + Math.random(),
  }));
}

// ─── Obstacle sizing ──────────────────────────────────────────────────────────

function obstacleSize(type: ObstacleType, canvasH: number): { w: number; h: number; yOff: number } {
  const gY = groundY(canvasH);
  switch (type) {
    case 'figma':   return { w: 28, h: 36, yOff: gY - 36 - 10 };
    case 'powerbi': return { w: 22, h: 14, yOff: gY - 14 };
    case 'laptop':  return { w: 32, h: 24, yOff: gY - 24 };
    case 'coffee':  return { w: 16, h: 18, yOff: gY - 18 };
  }
}

const OBS_TYPES: ObstacleType[] = ['figma', 'powerbi', 'laptop', 'coffee'];

// ─── GameCanvas ───────────────────────────────────────────────────────────────

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  // Game state refs (mutable, no re-render needed)
  const state = useRef({
    running: false,
    dead: false,
    started: false,
    score: 0,
    best: 0,
    flash: false,
    flashTimer: 0,
    speed: 4,
    frameCount: 0,
    sinceLastObs: 0,

    player: null as Player | null,
    obstacles: [] as Obstacle[],
    layers: [] as BuildingLayer[],
    stars: [] as Star[],

    canvasW: 0,
    canvasH: 220,
  });

  const [loopRunning, setLoopRunning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const isMobileGame = useRef(false);

  // Detect touch-only and mobile screen width (once on mount)
  useEffect(() => {
    const touch = window.matchMedia('(hover: none)').matches;
    setIsMobile(touch);
    isMobileGame.current = window.innerWidth < 768;
  }, []);

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      canvas.width = w;
      canvas.height = 220;
      const s = state.current;
      s.canvasW = w;
      s.canvasH = 220;
      if (!s.started) {
        s.layers = makeLayers(w, 220, s.speed);
        s.stars = makeStars(w, 220);
        drawIdle(canvas);
      }
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  function initGame() {
    const s = state.current;
    const { canvasW, canvasH } = s;
    s.score = 0;
    s.speed = isMobileGame.current ? 5.5 : 4;
    s.frameCount = 0;
    s.sinceLastObs = 0;
    s.dead = false;
    s.flash = false;
    s.flashTimer = 0;
    s.obstacles = [];
    s.layers = makeLayers(canvasW, canvasH, s.speed);
    s.player = {
      x: PLAYER_X,
      y: playerGroundY(canvasH),
      vy: 0,
      onGround: true,
      frame: 0,
      dead: false,
      deadTimer: 0,
      angle: 0,
    };
  }

  function drawIdle(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { canvasW, canvasH, stars, layers } = state.current;

    ctx.clearRect(0, 0, canvasW, canvasH);
    drawBackground(ctx, layers, stars, canvasW, canvasH);

    // Ground
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, groundY(canvasH));
    ctx.lineTo(canvasW, groundY(canvasH));
    ctx.stroke();

    // Static player
    const p: Player = {
      x: PLAYER_X,
      y: playerGroundY(canvasH),
      vy: 0,
      onGround: true,
      frame: 0,
      dead: false,
      deadTimer: 0,
      angle: 0,
    };
    drawPlayer(ctx, p, canvasH);

    // Prompt
    const label = isMobile ? 'TAP to run' : 'SPACE to run';
    ctx.font = '13px "Geist Mono", monospace';
    ctx.fillStyle = 'rgba(250,250,250,0.4)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, canvasW / 2, canvasH / 2);
  }

  const jump = useCallback(() => {
    const s = state.current;
    if (!s.started) {
      s.started = true;
      initGame();
      setLoopRunning(true);
      return;
    }
    if (s.dead) return;
    if (s.player && s.player.onGround) {
      s.player.vy = isMobileGame.current ? -14 : JUMP_V;
      s.player.onGround = false;
    }
  }, []);

  const restart = useCallback(() => {
    const s = state.current;
    if (!s.dead) return;
    initGame();
    s.dead = false;
  }, []);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Never intercept keys when the user is typing in an input or textarea
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return
      if (e.code !== 'Space') return;
      e.preventDefault();
      const s = state.current;
      if (!s.started || s.dead) {
        if (s.dead) restart();
        else jump();
      } else {
        jump();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [jump, restart]);

  // Touch
  const handleTap = useCallback(() => {
    const s = state.current;
    if (!s.started) jump();
    else if (s.dead) restart();
    else jump();
  }, [jump, restart]);

  // Game loop tick
  const tick = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const s = state.current;
    const { canvasW, canvasH } = s;
    const p = s.player;
    if (!p) return;

    // ── Update ──────────────────────────────────────────────────────────────

    if (!s.dead) {
      // Speed ramp — faster on mobile
      s.speed += isMobileGame.current ? 0.001 : 0.0008;
      s.score = Math.floor(s.frameCount * s.speed * 0.1);
      s.frameCount++;
      s.sinceLastObs++;

      // Player physics
      if (!p.onGround) {
        p.vy += GRAVITY;
        p.y += p.vy;
        const gnd = playerGroundY(canvasH);
        if (p.y >= gnd) {
          p.y = gnd;
          p.vy = 0;
          p.onGround = true;
        }
      }
      p.frame++;

      // Obstacles
      const MIN_GAP_FRAMES = Math.floor(400 / s.speed);
      if (s.sinceLastObs > MIN_GAP_FRAMES && Math.random() < 0.015) {
        const type = OBS_TYPES[Math.floor(Math.random() * OBS_TYPES.length)];
        const sz = obstacleSize(type, canvasH);
        s.obstacles.push({
          type,
          x: canvasW + 10,
          y: sz.yOff,
          w: sz.w,
          h: sz.h,
          angle: 0,
          laptopAngle: (110 * Math.PI) / 180,
          pulseT: 0,
        });
        s.sinceLastObs = 0;
      }

      s.obstacles.forEach((obs) => {
        obs.x -= s.speed;
        obs.pulseT++;
        if (obs.type === 'coffee') obs.angle += 0.07;
        if (obs.type === 'laptop') {
          // Close lid as it approaches player
          const progress = Math.max(0, Math.min(1, 1 - (obs.x - PLAYER_X) / (canvasW * 0.6)));
          obs.laptopAngle = ((110 - 90 * progress) * Math.PI) / 180;
        }
      });

      s.obstacles = s.obstacles.filter((o) => o.x + o.w > -20);

      // Collision
      const pBox = {
        x: p.x + INSET,
        y: p.y + INSET,
        w: PLAYER_W - INSET * 2,
        h: PLAYER_H - INSET * 2,
      };
      for (const obs of s.obstacles) {
        const oBox = {
          x: obs.x + INSET,
          y: obs.y + INSET,
          w: obs.w - INSET * 2,
          h: obs.h - INSET * 2,
        };
        if (
          pBox.x < oBox.x + oBox.w &&
          pBox.x + pBox.w > oBox.x &&
          pBox.y < oBox.y + oBox.h &&
          pBox.y + pBox.h > oBox.y
        ) {
          s.dead = true;
          p.dead = true;
          p.deadTimer = 0;
          if (s.score > s.best) {
            s.best = s.score;
            s.flash = true;
            s.flashTimer = 60;
          }
          break;
        }
      }

      // Building layers scroll
      if (!prefersReduced) {
        s.layers.forEach((layer) => {
          layer.rects.forEach((r) => {
            r.x -= layer.speed;
          });
          // Wrap
          const first = layer.rects[0];
          if (first.x + first.w < 0) {
            const last = layer.rects[layer.rects.length - 1];
            layer.rects.shift();
            layer.rects.push({
              x: last.x + last.w + 50 + Math.random() * 30,
              w: first.w,
              h: 10 + Math.random() * 130,
            });
          }
        });
      }
    } else {
      // Dead animation
      p.deadTimer++;
    }

    // Flash timer
    if (s.flashTimer > 0) s.flashTimer--;
    else s.flash = false;

    // ── Draw ────────────────────────────────────────────────────────────────

    ctx.clearRect(0, 0, canvasW, canvasH);

    // Dim overlay when dead
    if (s.dead && p.deadTimer > 24) {
      ctx.fillStyle = 'rgba(10,10,10,0.4)';
      ctx.fillRect(0, 0, canvasW, canvasH);
    }

    drawBackground(ctx, s.layers, s.stars, canvasW, canvasH);

    // Ground line
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, groundY(canvasH));
    ctx.lineTo(canvasW, groundY(canvasH));
    ctx.stroke();

    s.obstacles.forEach((obs) => drawObstacle(ctx, obs, canvasH));
    drawPlayer(ctx, p, canvasH);
    drawHUD(ctx, s.score, s.best, s.flash, canvasW);

    // State messages
    if (s.dead && p.deadTimer > 24) {
      ctx.font = '13px "Geist Mono", monospace';
      ctx.fillStyle = 'rgba(250,250,250,0.5)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PRESS SPACE TO RESTART', canvasW / 2, canvasH / 2);
    }
  }, [prefersReduced]);

  useGameLoop(tick, loopRunning);

  return (
    <div ref={wrapRef} style={{ width: '100%' }}>
      <canvas
        ref={canvasRef}
        height={220}
        role="img"
        aria-label="Mini game: Roberto Runs. Press Space to jump over obstacles."
        onClick={handleTap}
        style={{
          display: 'block',
          width: '100%',
          height: '220px',
          borderRadius: '1rem',
          background: '#0A0A0A',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          cursor: 'pointer',
          touchAction: 'none',
        }}
      />
    </div>
  );
}
