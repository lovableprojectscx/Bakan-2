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
