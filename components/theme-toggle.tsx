"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const isLight = document.documentElement.classList.contains("light");
    setLight(isLight);
  }, []);

  const toggle = () => {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("scopex-theme", next ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide"
      aria-label="Toggle theme"
    >
      {light ? "Dark" : "Light"}
    </button>
  );
}
