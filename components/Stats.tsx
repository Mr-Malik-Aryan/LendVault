import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";

const stats = [
  {
    icon: DollarSign,
    value: "$1.2B+",
    label: "Total Loans Issued",
    description: "All-time lending volume",
  },
  {
    icon: Users,
    value: "50K+",
    label: "Active Borrowers",
    description: "Growing community",
  },
  {
    icon: Activity,
    value: "75K+",
    label: "NFTs Collateralized",
    description: "Unique digital assets",
  },
  {
    icon: TrendingUp,
    value: "30%",
    label: "Average Loan ROI",
    description: "For top borrowers",
  },
];

const Stats = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
      {/* Background accent */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container mx-auto relative z-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
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
                  <div className="text-4xl font-bold text-foreground mb-1">{stat.value}</div>
                  <div className="text-lg font-semibold text-foreground">{stat.label}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Stats;
