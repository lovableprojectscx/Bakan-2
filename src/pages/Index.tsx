import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { CommissionCalculator } from "@/components/CommissionCalculator";
import { About } from "@/components/About";
import { HowItWorks } from "@/components/HowItWorks";
import { Footer } from "@/components/Footer";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const [isCheckingMobile, setIsCheckingMobile] = useState(true);

  useEffect(() => {
    // Redirect mobile users directly to auth/login
    const checkMobile = () => {
      if (window.innerWidth < 768) {
        navigate('/auth');
      } else {
        setIsCheckingMobile(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [navigate]);

  if (isCheckingMobile) return <div className="min-h-screen bg-background" />; // Show empty while checking

  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Features />
      <CommissionCalculator />
      <About />
      <HowItWorks />
      <Footer />
    </main>
  );
};

export default Index;
