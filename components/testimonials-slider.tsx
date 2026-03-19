"use client";

import { useEffect, useState } from "react";
import { testimonials } from "@/lib/data";

export function TestimonialsSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section id="testimonials" className="section-wrap mt-16 scroll-mt-32">
      <h2 className="text-2xl font-bold md:text-3xl">Testimonials</h2>
      <div className="mt-6 rounded-2xl border border-black/10 bg-[var(--surface)] p-6 dark:border-white/10">
        <p className="text-base leading-relaxed md:text-lg">“{testimonials[index].text}”</p>
        <div className="mt-5 flex items-center justify-between">
          <div>
            <p className="font-semibold">{testimonials[index].name}</p>
            <p className="text-sm text-[var(--muted)]">{testimonials[index].role}</p>
          </div>
          <div className="flex gap-2">
            {testimonials.map((item, dotIndex) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setIndex(dotIndex)}
                className={`h-2.5 w-2.5 rounded-full ${dotIndex === index ? "bg-scopex-orange" : "bg-black/20 dark:bg-white/20"}`}
                aria-label={`View testimonial ${dotIndex + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
