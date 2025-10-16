import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import FeaturedSkills from "@/components/FeaturedSkills";
import Footer from "@/components/Footer";
import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    // Ensure scroll to top on navigation to landing
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <HowItWorks />
      <FeaturedSkills />
      <Footer />
    </div>
  );
};

export default Index;
