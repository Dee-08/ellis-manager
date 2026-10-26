import { useEffect } from "react";

// Animate on entry, without making content depend on the observer to be visible.
export function usePublicMotion(root) {
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const elements = [
      ...(root.current?.querySelectorAll(
        "h1:not(.el-sr), h2, h3, blockquote",
      ) || []),
    ];
    let observer;
    const configure = () => {
      observer?.disconnect();
      elements.forEach((el) => el.classList.remove("el-arrive"));
      if (motion.matches || !("IntersectionObserver" in window)) return;
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("el-arrive");
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.15 },
      );
      elements.forEach((el) => observer.observe(el));
    };
    configure();
    motion.addEventListener("change", configure);
    return () => {
      observer?.disconnect();
      motion.removeEventListener("change", configure);
    };
  }, [root]);
}
