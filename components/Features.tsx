import { Shield, Zap, Globe, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Shield,
    title: "Secure NFT Collateral",
    description: "Your NFTs are protected with advanced blockchain security while serving as collateral.",
  },
  {
    icon: Zap,
    title: "Quick Loan Approvals",
    description: "Instant Ethereum loans with minimal processing time. Get funds in minutes.",
  },
  {
    icon: Globe,
    title: "Global Lending Network",
    description: "Access lenders and borrowers worldwide. A truly borderless lending platform.",
  },
  {
    icon: Lock,
    title: "Ownership Retained",
    description: "Keep ownership of your NFTs while leveraging their value for loans.",
  },
];

const Features = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl sm:text-5xl font-bold">
            Why Choose <span className="text-primary">LendVault</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Built for NFT holders seeking Ethereum loans. Experience the future of collateralized lending.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="p-6 bg-card border-border hover:border-primary/50 transition-all hover:shadow-nft-glow group cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
