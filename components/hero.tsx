"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type HeroSlide = {
  type: "hero" | "advisor" | "package";
  title: string;
  tag?: string;
  route?: string;
  oldPrice?: string;
  price?: string;
  discount?: string;
  save?: string;
  benefit: string;
  points: string[];
};

const popularTests = [
  { label: "CBC", href: "/tests?focus=basic-tests&filter=blood&search=cbc" },
  { label: "Lipid Profile", href: "/tests?focus=profile-tests&filter=profile&search=lipid" },
  { label: "Thyroid", href: "/tests?focus=profile-tests&filter=profile&search=thyroid" },
  { label: "Vitamin D", href: "/tests?focus=hormone-special-tests&filter=hormone&search=vitamin%20d" },
  { label: "HbA1c", href: "/tests?focus=basic-tests&filter=blood&search=hba1c" },
  { label: "LFT", href: "/tests?focus=organ-function-tests&filter=profile&search=liver" }
];

const heroSlides: HeroSlide[] = [
  {
    type: "hero",
    title: "Book Blood Test at Home",
    tag: "Home Diagnostics Across India",
    benefit: "Accurate, affordable diagnostics with home sample collection.",
    points: ["Pan India Diagnostic Network", "All Major Cities Across India"]
  },
  {
    type: "package",
    title: "Burnout Predictor",
    tag: "Stress",
    route: "/packages/burnout-predictor-basic",
    oldPrice: "\u20B95800",
    price: "\u20B92480",
    discount: "57% OFF",
    save: "Save \u20B93320",
    benefit: "Detect stress before it affects your health",
    points: ["Know your energy & fatigue levels", "Prevent burnout early"]
  },
  {
    type: "package",
    title: "Health 360",
    tag: "Most Popular",
    route: "/packages/health-360-basic",
    oldPrice: "\u20B91950",
    price: "\u20B9699",
    discount: "64% OFF",
    save: "Save \u20B91251",
    benefit: "Complete body checkup at the best price",
    points: ["Ideal for routine health monitoring", "Early risk detection made simple"]
  },
  {
    type: "package",
    title: "Gut Health",
    tag: "Digestive",
    route: "/packages/gut-health-check",
    oldPrice: "\u20B97200",
    price: "\u20B93599",
    discount: "50% OFF",
    save: "Save \u20B93601",
    benefit: "Fix digestion & boost immunity",
    points: ["Identify gut-related issues early", "Improve nutrient absorption"]
  },
  {
    type: "package",
    title: "PCOD Package",
    tag: "Women Health",
    route: "/packages/pcod-package",
    oldPrice: "\u20B95000",
    price: "\u20B92500",
    discount: "50% OFF",
    save: "Save \u20B92500",
    benefit: "Balance hormones & manage PCOD",
    points: ["Supports cycle regularity", "Helps with skin & weight issues"]
  },
  {
    type: "package",
    title: "STD Package",
    tag: "Confidential",
    route: "/packages/std-package",
    oldPrice: "\u20B93000",
    price: "\u20B91250",
    discount: "60% OFF",
    save: "Save \u20B91750",
    benefit: "Safe, private & early detection",
    points: ["100% confidential testing", "Prevent future complications"]
  },
  {
    type: "package",
    title: "Longevity Package",
    tag: "40+ Care",
    route: "/packages/longevity-package",
    oldPrice: "\u20B912000",
    price: "\u20B94999",
    discount: "58% OFF",
    save: "Save \u20B97001",
    benefit: "Stay healthy as you age",
    points: ["Detect age-related risks early", "Plan long-term health confidently"]
  },
  {
    type: "advisor",
    title: "Not Sure What to Book?",
    tag: "Expert Guidance",
    route: "/health-advisor",
    benefit: "Avoid wrong tests. Get expert advice instantly â€” before & after reports.",
    points: ["Free expert guidance", "Quick callback support"]
  }
];

const tagStyles: Record<string, string> = {
  "Home Diagnostics Across India": "bg-[#fff3e5] text-[#F7931E] border border-[#d8efeb]",
  "Expert Guidance": "bg-[#eef8ff] text-[#1a78b8] border border-[#d6eafb]",
  Stress: "bg-[#fff2e8] text-[#F7931E] border border-[#ffd9c4]",
  "Most Popular": "bg-[#fff6db] text-[#a06a00] border border-[#f6df99]",
  Digestive: "bg-[#eef8e8] text-[#4e8a21] border border-[#d2ebbd]",
  "Women Health": "bg-[#ffeaf4] text-[#d33b82] border border-[#f6c8df]",
  Confidential: "bg-[#eef2f7] text-[#556476] border border-[#d5dce5]",
  "40+ Care": "bg-[#edf0ff] text-[#5564d9] border border-[#d6dcff]"
};

function HeroSupportPanel({ className = "" }: { className?: string }) {
  return (
    <div className={`grid gap-3 pt-1 lg:max-w-[300px] ${className}`.trim()}>
      <div className="rounded-[22px] border border-[#d9ebe7] bg-[#FFF8F2] p-4 shadow-[0_10px_24px_rgba(15,143,124,0.08)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F7931E]">
          Why patients choose ScopeX
        </p>
        <ul className="mt-3 space-y-2 text-xs leading-6 text-[#5f6868] md:text-[13px]">
          <li>{"\u2714"} Easy online booking</li>
          <li>{"\u2714"} Home sample collection</li>
          <li>{"\u2714"} Preventive health packages</li>
          <li>{"\u2714"} Fast digital reports</li>
        </ul>
      </div>

      <div className="rounded-[22px] border border-[#d9ebe7] bg-white p-4 shadow-[0_10px_24px_rgba(16,24,40,0.06)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F7931E]">
          Popular tests
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {popularTests.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-full bg-[#eef7f6] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#24484a] transition hover:bg-[#fff2e9] hover:text-[#F7931E]"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="mt-3">
          <Link
            href="/tests"
            className="inline-flex items-center justify-center rounded-full border border-[#f1dfce] bg-[#FFF8F2] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#264547] transition hover:border-[#ffd8bf] hover:bg-[#fff7f1] hover:text-[#F7931E]"
          >
            View All Tests
          </Link>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setActive((prev) => (prev + 1) % heroSlides.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [paused]);

  const goPrev = () => setActive((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  const goNext = () => setActive((prev) => (prev + 1) % heroSlides.length);

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

  return (
    <section id="hero" className="container-px pt-5 md:pt-8">
      <div
        className="section-wrap rounded-[32px] border border-[#d9ebe7] bg-white px-4 py-4 shadow-[0_20px_60px_rgba(16,24,40,0.08)] sm:px-6 md:px-10 md:py-8"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="relative overflow-hidden rounded-[28px] border border-[#f1dfce] bg-[linear-gradient(180deg,#ffffff_0%,#f8fcfb_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] md:p-6">
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6 lg:items-start">
            <div className="relative min-h-[420px] sm:min-h-[450px] md:min-h-[470px] lg:min-h-[390px]">
            {heroSlides.map((slide, index) => {
              const isActive = index === active;
              const tagStyle = slide.tag ? tagStyles[slide.tag] ?? "bg-[#fff3e5] text-[#F7931E] border border-[#d8efeb]" : "";
              return (
                <div
                  key={`${slide.title}-${index}`}
                  className="absolute inset-0 transition-[opacity,transform] duration-500 ease-out"
                  style={{
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? "translateX(0)" : "translateX(2%)",
                    pointerEvents: isActive ? "auto" : "none",
                    visibility: isActive ? "visible" : "hidden"
                  }}
                >
                  <div className="h-full">
                    {slide.type === "hero" || slide.type === "advisor" ? (
                      <div className="max-w-[620px] pr-2 pt-1 lg:max-w-[560px]">
                        {slide.tag ? (
                          <span className={`inline-flex rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] md:text-xs ${tagStyle}`}>
                            {slide.tag}
                          </span>
                        ) : null}
                        <h1 className="mt-5 max-w-[520px] text-[2.75rem] font-extrabold leading-[0.98] text-[#0D0D0D] sm:text-[3.4rem] md:max-w-[620px] md:text-[4.8rem] lg:max-w-[520px] lg:text-[4rem]">
                          {slide.title}
                        </h1>
                        <p className="mt-4 max-w-[540px] text-lg leading-8 text-[#5f6868] md:text-[1.3rem] lg:max-w-[470px] lg:text-[1.15rem] lg:leading-7">
                          {slide.benefit}
                        </p>
                        <div className="mt-4 space-y-1 text-sm font-semibold uppercase tracking-[0.12em] text-[#F7931E] md:text-base lg:text-[0.92rem]">
                          {slide.points.map((point) => (
                            <p key={point}>{point}</p>
                          ))}
                        </div>
                        {slide.type === "advisor" ? (
                          <div className="mt-6 inline-flex items-center">
                            <Link
                              href={slide.route ?? "/health-advisor"}
                              className="inline-flex items-center text-[12px] font-semibold uppercase tracking-[0.08em] text-[#F7931E] transition hover:text-[#F7931E] md:text-sm"
                            >
                              Talk to Advisor
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <Link
                        href={slide.route ?? "/packages"}
                        className="mx-auto flex min-h-[360px] w-full max-w-[352px] cursor-pointer flex-col justify-between rounded-[24px] border border-[#f1dfce] bg-white px-4 py-4 shadow-[0_16px_36px_rgba(16,24,40,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(16,24,40,0.1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F7931E] sm:min-h-[372px] md:max-w-none md:px-5 md:py-5 lg:min-h-[360px] lg:max-w-[700px] lg:px-5 lg:py-5"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${tagStyle}`}>
                              {slide.tag}
                            </span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#F7931E]">
                              {slide.discount}
                            </span>
                          </div>

                          <h2 className="mt-3 text-[1.6rem] font-extrabold uppercase leading-[1.04] text-[#0D0D0D] sm:text-[1.8rem] md:mt-4 md:text-[2.45rem] lg:text-[3rem]">
                            {slide.title}
                          </h2>

                          <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-2 md:mt-5 md:gap-x-5">
                            {slide.price ? (
                              <span className="text-[2.5rem] font-extrabold leading-none text-[#F7931E] sm:text-[2.8rem] md:text-[4rem] lg:text-[3.6rem]">
                                {slide.price}
                              </span>
                            ) : null}

                            <div className="flex flex-col gap-1 pb-1">
                              {slide.oldPrice ? (
                                <span className="text-[0.9rem] leading-none text-[#8ca0a2] line-through md:text-[1.1rem] lg:text-[0.95rem]">{slide.oldPrice}</span>
                              ) : null}
                              {slide.discount ? (
                                <span className="inline-flex w-fit rounded-full bg-[#fff4ec] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#F7931E] md:px-3 md:py-1.5 md:text-[11px]">
                                  {slide.discount}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {slide.save ? (
                            <p className="mt-2 text-[1rem] font-bold text-[#F7931E] md:mt-3 md:text-[1.35rem] lg:text-[1.1rem]">{slide.save}</p>
                          ) : null}

                          <p className="mt-4 text-[1.03rem] font-semibold leading-7 text-[#28484a] sm:text-[1.08rem] md:mt-5 md:text-[1.35rem] md:leading-8 lg:mt-4 lg:max-w-[520px] lg:text-[1.1rem] lg:leading-7">
                            {slide.benefit}
                          </p>

                          <ul className="mt-3 space-y-2 text-[0.95rem] leading-6 text-[#516b6d] md:mt-4 md:space-y-3 md:text-lg md:leading-7 lg:space-y-2 lg:text-[1rem] lg:leading-6">
                            {slide.points.map((point) => (
                              <li key={point} className="flex items-start gap-2.5">
                                <span className="mt-0.5 text-[#F7931E]">{"\u2022"}</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-4 inline-flex items-center text-[12px] font-semibold uppercase tracking-[0.08em] text-[#F7931E] transition hover:text-[#F7931E] md:mt-6 md:text-sm">
                          View Package
                        </div>
                      </Link>
                    )}

                  </div>
                </div>
              );
            })}
            </div>
            <HeroSupportPanel className="hidden lg:grid lg:pt-7" />
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-[#e2efec] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex justify-center gap-2 sm:justify-start">
              {heroSlides.map((slide, index) => (
                <button
                  key={`${slide.title}-dot`}
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  className={`rounded-full transition ${index === active ? "h-2.5 w-7 bg-[#F7931E]" : "h-2.5 w-2.5 bg-[#cfe0dd] hover:bg-[#9ec8c0]"}`}
                />
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/book-home-collection" className="cta-btn w-full sm:w-auto">
                Book Test Now
              </Link>
              <Link href="/packages" className="secondary-btn w-full sm:w-auto">
                View Packages
              </Link>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:hidden">
            <HeroSupportPanel />
          </div>

          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#d9ebe7] bg-white text-[#2b4c4e] shadow-[0_8px_20px_rgba(16,24,40,0.08)] transition hover:border-[#ffd8bf] hover:text-[#F7931E] md:flex"
          >
            {"\u2039"}
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#d9ebe7] bg-white text-[#2b4c4e] shadow-[0_8px_20px_rgba(16,24,40,0.08)] transition hover:border-[#ffd8bf] hover:text-[#F7931E] md:flex"
          >
            {"\u203A"}
          </button>
        </div>
      </div>
    </section>
  );
}



