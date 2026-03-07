import HeroSection from "@/components/HeroSection";
import Navbar from "@/components/Navbar";
import FeaturesSection from "@/components/FeaturesSection";
import LiveIntelPreview from "@/components/LiveIntelPreview";
import CommodityTickerLanding from "@/components/CommodityTickerLanding";
import SignalMapPreview from "@/components/SignalMapPreview";
import Footer from "@/components/Footer";
import PricingSection from "@/components/PricingSection";
import CTABanner from "@/components/CTABanner";

const Index = () => {
  return (
    <div className="bg-background">
      <Navbar />
      <HeroSection />
      <CommodityTickerLanding />
      <FeaturesSection />
      <LiveIntelPreview />
      <SignalMapPreview />
      <PricingSection />
      <CTABanner />
      <Footer />
    </div>
  );
};

export default Index;
