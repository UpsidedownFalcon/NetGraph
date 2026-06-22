"use client";

import { useEffect, useRef } from "react";

// Purely decorative: tiny, dim, slowly drifting stars on a separate layer
// behind everything. Non-interactive — never to be confused with person nodes.
export default function Constellation() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    let stars = [];
    // Respect users who prefer less motion: we'll skip the drifting/twinkle.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // (Re)build the star field sized to the window.
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const count = Math.floor((canvas.width * canvas.height) / 9000);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.6 + 0.7,                 // radius (bigger)
        baseAlpha: Math.random() * 0.35 + 0.2,        // base brightness (brighter)
        twinkle: Math.random() * Math.PI * 2,         // twinkle phase offset
        vx: (Math.random() - 0.5) * 0.14,             // drift speed x (faster)
        vy: (Math.random() - 0.5) * 0.14,             // drift speed y (faster)
      }));
    }

    // One animation frame: clear, move + twinkle each star, redraw.
    function draw(t) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        if (!reduced) {
          s.x += s.vx;
          s.y += s.vy;
          // Wrap around the edges so stars never run out.
          if (s.x < 0) s.x = canvas.width;
          if (s.x > canvas.width) s.x = 0;
          if (s.y < 0) s.y = canvas.height;
          if (s.y > canvas.height) s.y = 0;
        }
        const tw = reduced ? 1 : 0.7 + 0.3 * Math.sin(t / 1400 + s.twinkle);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(175, 190, 230, ${s.baseAlpha * tw})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(draw);
    // Cleanup: stop the loop and listener when the component unmounts.
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",   // never intercept clicks
        zIndex: 0,               // sit behind the app content
      }}
    />
  );
}
