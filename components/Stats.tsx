"use client";

import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";
import { useEffect, useState, useRef } from "react";

interface StatsData {
  totalLoansIssuedWei: string;
  totalLoans: number;
  uniqueBorrowers: number;
  totalNFTs: number;
  avgInterestRate: string;
}

const Stats = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [animatedLoans, setAnimatedLoans] = useState("0");
  const [animatedBorrowers, setAnimatedBorrowers] = useState(0);
  const [animatedNFTs, setAnimatedNFTs] = useState(0);
  const [animatedInterest, setAnimatedInterest] = useState(0);
  const hasAnimated = useRef(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (stats && !hasAnimated.current) {
      // Set up intersection observer to trigger animation when visible
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            animateNumbers();
          }
        },
        { threshold: 0.3 }
      );

      if (sectionRef.current) {
        observer.observe(sectionRef.current);
      }

      return () => observer.disconnect();
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
    } finally {
      setLoading(false);
    }
  };

  const animateNumbers = () => {
    if (!stats) return;

    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepDuration = duration / steps;

    // Animate Wei amount
    const targetWei = BigInt(stats.totalLoansIssuedWei);
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

    // Animate Interest Rate
    const targetInterest = parseFloat(stats.avgInterestRate);
    let currentInterest = 0;
    const interestInterval = setInterval(() => {
      currentInterest += targetInterest / steps;
      if (currentInterest >= targetInterest) {
        setAnimatedInterest(targetInterest);
        clearInterval(interestInterval);
      } else {
        setAnimatedInterest(currentInterest);
      }
    }, stepDuration);
  };

  const formatWei = (wei: string) => {
    if (!wei) return "0";
    
    // If number has more than 4 digits, format with K, M, B, T, Q
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

  const statsDisplay = stats ? [
    {
      icon: DollarSign,
      value: formatWei(animatedLoans) + "+ Wei",
      label: "Total Loans Issued",
      description: "All-time lending volume",
    },
    {
      icon: Users,
      value: formatNumber(animatedBorrowers),
      label: "Active Borrowers",
      description: "Growing community",
    },
    {
      icon: Activity,
      value: animatedNFTs.toString() + "+",
      label: "NFTs Collateralized",
      description: "Unique digital assets",
    },
    {
      icon: TrendingUp,
      value: animatedInterest.toFixed(1) + "%+",
      label: "Average Interest Rate",
      description: "APR across all loans",
    },
  ] : [];
  return (
    <section ref={sectionRef} className="py-20 px-4 sm:px-6 lg:px-8 relative">
      {/* Background accent */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container mx-auto relative z-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {loading ? (
            // Loading skeletons
            [1, 2, 3, 4].map((i) => (
              <div 
                key={i}
                className="text-center space-y-4 p-6 rounded-2xl bg-card/50 border border-border animate-pulse"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mx-auto"></div>
                <div>
                  <div className="h-10 bg-secondary rounded w-24 mx-auto mb-2"></div>
                  <div className="h-6 bg-secondary rounded w-32 mx-auto mb-2"></div>
                  <div className="h-4 bg-secondary rounded w-28 mx-auto"></div>
                </div>
              </div>
            ))
          ) : (
            statsDisplay.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={index}
                  className="text-center space-y-4 p-6 rounded-2xl bg-card/50 border border-border hover:border-primary/30 transition-all hover:shadow-nft-glow group"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-foreground mb-1 font-mono break-words px-2">{stat.value}</div>
                    <div className="text-lg font-semibold text-foreground">{stat.label}</div>
                    <div className="text-sm text-muted-foreground mt-1">{stat.description}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};

export default Stats;
