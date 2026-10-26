import React, { useEffect, useRef } from "react";
import "./principles-marquee.css";

export default function PrinciplesMarquee() {
  const section = useRef(null);
  const track = useRef(null);

  useEffect(() => {
    const region = section.current;
    const belt = track.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame;
    let hovered = false;
    let focused = false;
    const changeSpeed = () => {
      cancelAnimationFrame(frame);
      if (preference.matches) return;
      const animation = belt.getAnimations()[0];
      if (!animation) return;
      const initial = animation.playbackRate;
      const target = hovered || focused ? 0 : 1;
      const start = performance.now();
      const ramp = (now) => {
        const progress = Math.min((now - start) / 500, 1);
        const eased = progress * progress * (3 - 2 * progress);
        animation.updatePlaybackRate(initial + (target - initial) * eased);
        if (progress < 1) frame = requestAnimationFrame(ramp);
      };
      frame = requestAnimationFrame(ramp);
    };
    const enter = () => {
      hovered = true;
      changeSpeed();
    };
    const leave = () => {
      hovered = false;
      changeSpeed();
    };
    const focus = () => {
      focused = true;
      changeSpeed();
    };
    const blur = () => {
      focused = false;
      changeSpeed();
    };
    region.addEventListener("mouseenter", enter);
    region.addEventListener("mouseleave", leave);
    region.addEventListener("focusin", focus);
    region.addEventListener("focusout", blur);
    preference.addEventListener("change", changeSpeed);
    return () => {
      cancelAnimationFrame(frame);
      region.removeEventListener("mouseenter", enter);
      region.removeEventListener("mouseleave", leave);
      region.removeEventListener("focusin", focus);
      region.removeEventListener("focusout", blur);
      preference.removeEventListener("change", changeSpeed);
    };
  }, []);

  return (
    <section
      ref={section}
      className="el-marquee"
      tabIndex={0}
      aria-label="Ellis: Clarity. Accountability. Follow-through. Focus here to pause the animation."
    >
      <div ref={track} className="el-marquee-track" aria-hidden="true">
        {[0, 1].map((copy) => (
          <div className="el-marquee-group" key={copy}>
            <img
              src="/brand/ellis-reverse.svg"
              width="924"
              height="299"
              alt=""
            />
            <span className="el-marquee-dot" />
            {["Clarity.", "Accountability.", "Follow-through."].map((label) => (
              <span className="el-marquee-pill" key={label}>
                {label}
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
