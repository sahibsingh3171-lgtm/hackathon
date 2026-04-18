import { LandingFeatures } from "@/components/marketing/landing-features";
import { LandingFinalCta } from "@/components/marketing/landing-final-cta";
import { LandingHero } from "@/components/marketing/landing-hero";
import { LandingHowItWorks } from "@/components/marketing/landing-how-it-works";
import { LandingPrivacy } from "@/components/marketing/landing-privacy";
import { LandingWhyMatters } from "@/components/marketing/landing-why-matters";

export default function HomePage() {
  return (
    <div className="relative flex flex-1 flex-col">
      <LandingHero />
      <LandingHowItWorks />
      <LandingWhyMatters />
      <LandingFeatures />
      <LandingPrivacy />
      <LandingFinalCta />
    </div>
  );
}
