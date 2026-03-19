import type { Metadata } from "next";
import { Hero } from "@/components/hero";
import { ServicesSection } from "@/components/services-section";
import { WhyChooseUs } from "@/components/why-choose-us";
import { TestimonialsSlider } from "@/components/testimonials-slider";
import { HomeOfferPopup } from "@/components/home-offer-popup";

export const metadata: Metadata = {
  title: "Home",
  description: "Book premium diagnostic services and home sample collection with SCOPEX."
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesSection />
      <WhyChooseUs />
      <TestimonialsSlider />
      <HomeOfferPopup />
    </>
  );
}
