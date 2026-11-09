import { useEffect, useState, useRef } from "react";

/**
 * Animated numerical counter component.
 * Uses requestAnimationFrame with cubic ease-out for silky 60fps transitions.
 * Triggers automatically when scrolled into view.
 */
export default function CountUp({
  end,
  start = 0,
  duration = 1800,
  decimals = 0,
  prefix = "",
  suffix = "",
  separator = ",",
  className = "",
}) {
  const [value, setValue] = useState(start);
  const elementRef = useRef(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Check prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(end);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimatedRef.current) {
            hasAnimatedRef.current = true;
            startAnimation();
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(element);

    function startAnimation() {
      const startTime = performance.now();
      const diff = end - start;

      function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Cubic ease-out: 1 - pow(1 - progress, 3)
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = start + diff * ease;

        setValue(current);

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          setValue(end);
        }
      }

      requestAnimationFrame(update);
    }

    return () => observer.disconnect();
  }, [end, start, duration]);

  // Format number
  const formatNumber = (num) => {
    const fixed = Number(num).toFixed(decimals);
    const [intPart, decPart] = fixed.split(".");
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
  };

  return (
    <span ref={elementRef} className={`count-up-number ${className}`}>
      {prefix}
      {formatNumber(value)}
      {suffix}
    </span>
  );
}
