"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const CTA = () => {
  const { isAuthenticated } = useAuth();

  const handleGetStartedClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      toast.error("Please connect your wallet first");
    }
  };
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-linear-to-r from-primary/10 via-transparent to-primary/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-3xl" />

      <div className="container mx-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8 py-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-foreground">Join the NFT Lending Revolution</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
            Ready to Unlock Your
            <span className="block text-primary mt-2">NFT's Value?</span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Use your NFTs as collateral to access Ethereum loans. Secure, fast, and reliable.
          </p>

          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Link href="/home/explore" onClick={handleGetStartedClick}>
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-nft-glow-lg group">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/learn-more">
              <Button size="lg" variant="outline" className="border-primary/30 text-foreground hover:bg-primary/10">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
