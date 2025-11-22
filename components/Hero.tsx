"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import heroImage from "@/public/hero.png";
import { PixelatedCanvas } from "@/components/ui/pixelated-canvas";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

import { useEffect, useState, useRef } from "react";

interface StatsData {
  totalLoansIssuedWei: string;
  totalLoans: number;
  uniqueBorrowers: number;
  totalNFTs: number;
  avgInterestRate: string;
}

const Hero = () => {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [animatedLoans, setAnimatedLoans] = useState("0");
  const [animatedNFTs, setAnimatedNFTs] = useState(0);
  const [animatedBorrowers, setAnimatedBorrowers] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (stats && !hasAnimated.current) {
      hasAnimated.current = true;
      animateNumbers();
    }
  }, [stats]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const animateNumbers = () => {
    if (!stats) return;

    // Animate Wei amount
    const targetWei = BigInt(stats.totalLoansIssuedWei);
    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepDuration = duration / steps;
    
    let currentStep = 0;
    const weiInterval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const currentValue = BigInt(Math.floor(Number(targetWei) * progress));
      setAnimatedLoans(currentValue.toString());
      
      if (currentStep >= steps) {
        clearInterval(weiInterval);
        setAnimatedLoans(stats.totalLoansIssuedWei);
      }
    }, stepDuration);

    // Animate NFTs
    const targetNFTs = stats.totalNFTs;
    let currentNFTs = 0;
    const nftInterval = setInterval(() => {
      currentNFTs += Math.ceil(targetNFTs / steps);
      if (currentNFTs >= targetNFTs) {
        setAnimatedNFTs(targetNFTs);
        clearInterval(nftInterval);
      } else {
        setAnimatedNFTs(currentNFTs);
      }
    }, stepDuration);

    // Animate Borrowers
    const targetBorrowers = stats.uniqueBorrowers;
    let currentBorrowers = 0;
    const borrowersInterval = setInterval(() => {
      currentBorrowers += Math.ceil(targetBorrowers / steps);
      if (currentBorrowers >= targetBorrowers) {
        setAnimatedBorrowers(targetBorrowers);
        clearInterval(borrowersInterval);
      } else {
        setAnimatedBorrowers(currentBorrowers);
      }
    }, stepDuration);
  };

  const handleGetStartedClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      toast.error("Please connect your wallet first");
    }
  };

  const formatWei = (wei: string) => {
    if (!wei) return "0";
    
    // If number has more than 4 digits, format with K
    if (wei.length > 4) {
      const num = Number(wei);
      if (num >= 1000000000000000) {
        return (num / 1000000000000000).toFixed(1) + "Q"; // Quadrillion
      } else if (num >= 1000000000000) {
        return (num / 1000000000000).toFixed(1) + "T"; // Trillion
      } else if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + "B"; // Billion
      } else if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + "M"; // Million
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + "K"; // Thousand
      }
    }
    
    return wei.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K+";
    }
    return num.toString();
  };
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-nft opacity-50" />
      
      {/* Glow effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />

      <div className="container mx-auto relative z-10">
        <div className="flex gap-12  items-center">
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">The Future of NFT Collateral Lending</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
              Unlock the Value of Your NFTs
              <span className="block text-primary mt-2">With Ethereum Loans</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl">
              Use your NFTs as collateral to access secure and fast Ethereum loans. Experience the future of decentralized finance.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/home/explore" onClick={handleGetStartedClick}>
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-nft-glow-lg group">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/learn-more">
                <Button size="lg" variant="outline" className="border-primary/30 text-foreground hover:bg-primary/10">
                  Learn More
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-8 pt-8">
              <div>
                <div className="text-2xl font-bold text-primary font-mono min-h-[2.5rem]">
                  {stats ? formatWei(animatedLoans) + "+ Wei" : ""}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Loans Issued</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary min-h-[2.5rem]">
                  {stats ? animatedNFTs + "+" : ""}
                </div>
                <div className="text-sm text-muted-foreground mt-1">NFTs Collateralized</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary min-h-[2.5rem]">
                  {stats ? formatNumber(animatedBorrowers) : ""}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Active Borrowers</div>
              </div>
            </div>
          </div>

          <div className="relative animate-scale-in">
            <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-2xl" />
            <div>
             
            <PixelatedCanvas
              src={heroImage.src}
              width={400}
              height={600}
              cellSize={4}
              dotScale={0.9}
              shape="square"
              backgroundColor="#0a121f"
              dropoutStrength={0.1}
              interactive
              distortionStrength={0.1}
              distortionRadius={200}
              distortionMode="repel"
              followSpeed={0.2}
              jitterStrength={4}
              jitterSpeed={1}
              sampleAverage
              className="rounded-xl shadow-lg"
            />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
