import type { Metadata } from "next";
import PackagesPage from "@/app/packages/page";
import { Hero } from "@/components/hero";
import { TestsCatalog } from "@/components/tests-catalog";
import { WhyChooseUs } from "@/components/why-choose-us";
import { TestimonialsSlider } from "@/components/testimonials-slider";
import { HomeOfferPopup } from "@/components/home-offer-popup";
import { HowItWorks } from "@/components/how-it-works";
import { FinalCta } from "@/components/final-cta";

export const metadata: Metadata = {
  title: "Home",
  description: "Premium single-page diagnostic experience for booking tests, packages, and home sample collection with SCOPEX."
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <PackagesPage />
      <TestsCatalog />
      <WhyChooseUs />
      <HowItWorks />
      <TestimonialsSlider />
      <FinalCta />
      <HomeOfferPopup />
    </>
  );
}
