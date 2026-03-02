import HeroSection from "@/components/HeroSection";
import Navbar from "@/components/Navbar";
import FeaturesSection from "@/components/FeaturesSection";

const Index = () => {
  return (
    <div className="bg-background">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
    </div>
  );
};

export default Index;
