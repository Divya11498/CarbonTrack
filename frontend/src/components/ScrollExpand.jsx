import { useEffect, useRef, useState } from "react";

/**
 * ScrollExpand — Inspired by ReactBits (https://reactbits.dev/animations/scroll-expand)
 * Smoothly expands a container towards full viewport width and softens border radius as the user scrolls.
 */
export default function ScrollExpand({
  children,
  className = "",
  initialWidthPercent = 88,
  targetWidthPercent = 100,
  initialRadius = 28,
  targetRadius = 16,
  initialScale = 0.96,
  targetScale = 1.0,
}) {
  const containerRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 1
      : 0
  );

  useEffect(() => {
    // Respect reduced motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let animationFrameId = null;

    const handleScroll = () => {
      if (animationFrameId) return;

      animationFrameId = requestAnimationFrame(() => {
        const el = containerRef.current;
        if (!el) {
          animationFrameId = null;
          return;
        }

        const rect = el.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // Start expanding when top of element enters bottom 80% of window
        // Fully expanded when element reaches top 25% of window
        const startOffset = windowHeight * 0.85;
        const endOffset = windowHeight * 0.25;

        const distance = startOffset - endOffset;
        const currentPos = startOffset - rect.top;

        const rawProgress = Math.min(Math.max(currentPos / distance, 0), 1);
        // Smooth ease-out cubic
        const progress = 1 - Math.pow(1 - rawProgress, 2.5);

        setScrollProgress(progress);
        animationFrameId = null;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Compute interpolated style values
  const currentWidth =
    initialWidthPercent + (targetWidthPercent - initialWidthPercent) * scrollProgress;
  const currentRadius =
    initialRadius - (initialRadius - targetRadius) * scrollProgress;
  const currentScale =
    initialScale + (targetScale - initialScale) * scrollProgress;

  return (
    <div
      ref={containerRef}
      className={`scroll-expand-wrapper ${className}`}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        padding: "0 12px",
        boxSizing: "border-box",
      }}
    >
      <div
        className="scroll-expand-container"
        style={{
          width: `${currentWidth}%`,
          maxWidth: "1280px",
          borderRadius: `${Math.round(currentRadius)}px`,
          transform: `scale(${currentScale})`,
          transition: "box-shadow 0.3s ease, border-color 0.3s ease",
          willChange: "transform, width, border-radius",
        }}
      >
        {children}
      </div>
    </div>
  );
}
