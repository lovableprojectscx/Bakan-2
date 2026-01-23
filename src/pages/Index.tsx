import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { CommissionCalculator } from "@/components/CommissionCalculator";
import { About } from "@/components/About";
import { HowItWorks } from "@/components/HowItWorks";
import { Footer } from "@/components/Footer";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

const Index = () => {
  const navigate = useNavigate();
  const [isCheckingMobile, setIsCheckingMobile] = useState(true);

  useEffect(() => {
    // Redirect mobile users directly to auth/login
    const checkPlatform = () => {
      // 1. Is this the Native App (APK)?
      const isNativeApp = Capacitor.isNativePlatform();

      // 2. Are we on a known Web Domain? (Safety net)
      const isWebDomain = window.location.hostname.includes('vercel.app') ||
        window.location.hostname.includes('lovable');

      // Only redirect if it IS the Native App AND NOT a Web Domain
      if (isNativeApp && !isWebDomain) {
        navigate('/auth');
      } else {
        setIsCheckingMobile(false);
      }
    };

    checkPlatform();
    // No resize listener needed for this logic
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
