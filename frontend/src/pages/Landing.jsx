import SmoothScroll from "@/components/SmoothScroll";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import { SocialProof, BrandMarquee, HowItWorks, Offers, FreeContent, Distinction } from "@/components/landing/Sections";
import { Pricing, Testimonials, FaqSection, FinalCta, Footer } from "@/components/landing/Pricing";

export default function Landing() {
  return (
    <SmoothScroll>
      <div className="bg-brand-ink text-white overflow-x-hidden">
        <Navbar />
        <main>
          <Hero />
          <SocialProof />
          <HowItWorks />
          <BrandMarquee />
          <Offers />
          <FreeContent />
          <Distinction />
          <Pricing />
          <Testimonials />
          <FaqSection />
          <FinalCta />
        </main>
        <Footer />
      </div>
    </SmoothScroll>
  );
}
