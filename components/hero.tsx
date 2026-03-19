"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Slide = {
  heading: string;
  subtext: string;
  variant: "main" | "stress" | "packages" | "advisor" | "home";
  badge?: string;
  credibility?: string;
  ctas: Array<{ label: string; href?: string; advisor?: boolean; variant?: "primary" | "secondary" }>;
};

const slides: Slide[] = [
  {
    heading: "Advanced Diagnostics, Delivered with SCOPEX Precision",
    subtext: "Book home sample collection, explore curated health packages, and receive accurate digital reports with speed.",
    variant: "main",
    badge: "Premium Medical Tech",
    ctas: [
      { label: "Book Home Collection", href: "/book-home-collection", variant: "primary" },
      { label: "View Packages", href: "/packages", variant: "secondary" }
    ]
  },
  {
    heading: "Understand How Stress Is Impacting Your Body",
    subtext: "Early detection helps prevent long-term health risks.",
    variant: "stress",
    badge: "Preventive Wellness",
    ctas: [{ label: "Check Now", href: "/packages#health-packages", variant: "primary" }]
  },
  {
    heading: "Preventive Health Packages",
    subtext: "Up to 60% Off on curated wellness packages.",
    variant: "packages",
    badge: "Limited Time Offer",
    credibility: "Trusted by 10,000+ families",
    ctas: [{ label: "View Packages", href: "/packages", variant: "primary" }]
  },
  {
    heading: "Not Sure Which Test to Choose?",
    subtext: "Get personalized recommendations from SCOPEX Test Expert.",
    variant: "advisor",
    badge: "Expert Guidance",
    ctas: [{ label: "Talk to Advisor", advisor: true, variant: "primary" }]
  },
  {
    heading: "Free Home Sample Collection",
    subtext: "On bookings above Rs 1000.",
    variant: "home",
    badge: "Fast Convenience",
    ctas: [{ label: "Book Now", href: "/book-home-collection", variant: "primary" }]
  }
];

const gradientByVariant: Record<Slide["variant"], string> = {
  main: "bg-[linear-gradient(120deg,#01060f_0%,#061632_58%,#1b140f_100%)]",
  stress: "bg-[linear-gradient(120deg,#01070f_0%,#091a35_56%,#17110d_100%)]",
  packages: "bg-[linear-gradient(120deg,#020913_0%,#0b1f3b_55%,#1b130e_100%)]",
  advisor: "bg-[linear-gradient(120deg,#020712_0%,#0a1d37_54%,#18120d_100%)]",
  home: "bg-[linear-gradient(120deg,#020a14_0%,#0b213d_52%,#1a130e_100%)]"
};

export function Hero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setActive((prev) => (prev + 1) % slides.length), 3800);
    return () => clearInterval(timer);
  }, [paused]);

  const goPrev = () => setActive((prev) => (prev - 1 + slides.length) % slides.length);
  const goNext = () => setActive((prev) => (prev + 1) % slides.length);

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      if (delta > 0) goPrev();
      else goNext();
    }
    touchStartX.current = null;
  };

  const openAdvisor = () => {
    window.dispatchEvent(new CustomEvent("scopex:open-advisor"));
  };

  return (
    <section className="container-px pt-2 md:pt-4">
      <div
        className="relative mx-auto h-[430px] w-full max-w-[1500px] overflow-hidden rounded-[22px] border border-white/15 shadow-premium sm:h-[500px] md:h-[620px]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {slides.map((slide, index) => {
          const isActive = index === active;

          return (
            <article
              key={slide.heading}
              className="absolute inset-0 transition-[opacity,transform] duration-500 ease-out"
              style={{
                opacity: isActive ? 1 : 0,
                transform: isActive ? "translateX(0)" : "translateX(2%)",
                pointerEvents: isActive ? "auto" : "none",
                visibility: isActive ? "visible" : "hidden"
              }}
            >
              <div className={`absolute inset-0 ${gradientByVariant[slide.variant]}`} />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(243,112,33,0.18),transparent_38%)]" />

              <div className="section-wrap relative z-10 flex h-full items-center">
                <div className="w-full max-w-4xl pb-14 pt-7 md:pb-20 md:pt-10">
                  {slide.badge ? (
                    <p className="inline-flex rounded-full border border-white/20 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/95 md:text-[13px]">
                      {slide.badge}
                    </p>
                  ) : null}

                  <h1
                    className="mt-4 max-w-4xl font-bold leading-[1.02] text-white"
                    style={{
                      fontSize: "clamp(2.25rem, 7vw, 5.2rem)",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}
                  >
                    {slide.heading}
                  </h1>

                  <p
                    className="mt-4 max-w-3xl text-white/90"
                    style={{
                      fontSize: "clamp(1rem, 2vw, 2rem)",
                      lineHeight: 1.35,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}
                  >
                    {slide.subtext}
                  </p>

                  {slide.credibility ? <p className="mt-4 text-base font-semibold text-scopex-orange md:text-[1.65rem]">{slide.credibility}</p> : null}

                  <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4 md:mt-9">
                    {slide.ctas.map((cta) => {
                      const btnClass = cta.variant === "secondary" ? "secondary-btn h-12 w-full text-sm sm:w-auto md:h-14 md:px-10" : "cta-btn h-12 w-full text-sm sm:w-auto md:h-14 md:px-10";

                      if (cta.advisor) {
                        return (
                          <button key={cta.label} type="button" onClick={openAdvisor} className={btnClass}>
                            {cta.label}
                          </button>
                        );
                      }

                      return (
                        <Link key={cta.label} href={cta.href ?? "/"} className={btnClass}>
                          {cta.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous slide"
          className="absolute left-5 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/45 text-white transition hover:bg-black/75 md:flex"
        >
          {"‹"}
        </button>
        <button
          type="button"
          onClick={goNext}
          aria-label="Next slide"
          className="absolute right-5 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/45 text-white transition hover:bg-black/75 md:flex"
        >
          {"›"}
        </button>

        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 md:bottom-6">
          {slides.map((slide, index) => (
            <button
              key={`${slide.heading}-dot`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`rounded-full transition ${index === active ? "h-2.5 w-7 bg-scopex-orange" : "h-2.5 w-2.5 bg-white/40 hover:bg-white/70"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
