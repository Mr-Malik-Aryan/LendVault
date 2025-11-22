"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Shield, Zap, TrendingUp, Image as ImageIcon, Lock, DollarSign, Clock, FileText } from "lucide-react";
import Link from "next/link";

const LearnMorePage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-bold">
              Lend<span className="text-primary">Vault</span>
            </Link>
            <Link href="/home/explore">
              <Button>
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-nft opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-5xl sm:text-6xl font-bold leading-tight">
              How <span className="text-primary">LendVault</span> Works
            </h1>
            <p className="text-xl text-muted-foreground">
              A comprehensive guide to NFT-backed lending on the Ethereum blockchain
            </p>
          </div>
        </div>
      </section>

      {/* What is LendVault */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="space-y-8">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <h2 className="text-4xl font-bold">What is <span className="text-primary">LendVault?</span></h2>
              <p className="text-lg text-muted-foreground">
                LendVault is a decentralized lending platform that allows you to use your NFTs (Non-Fungible Tokens) as collateral to borrow Ethereum (ETH). 
                Think of it as a pawn shop for digital assets, but completely decentralized and secured by smart contracts on the Ethereum blockchain.
              </p>
            </div>

            <Card className="p-8 border-primary/20 bg-card/50">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-primary">For Borrowers</h3>
                  <p className="text-muted-foreground">
                    If you own valuable NFTs but need liquidity, you can use your NFTs as collateral to get instant ETH loans. 
                    You don't have to sell your beloved digital assets - just temporarily lock them as collateral.
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>Keep ownership of your NFTs while accessing liquidity</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>Get instant ETH loans within minutes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Lock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>Secured by blockchain smart contracts</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-primary">For Lenders</h3>
                  <p className="text-muted-foreground">
                    If you have ETH to invest, you can lend it to borrowers and earn attractive interest rates. 
                    Your loan is secured by valuable NFT collateral, which you can claim if the borrower defaults.
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>Earn competitive interest on your ETH</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>Protected by NFT collateral</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <DollarSign className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>Diversify your crypto portfolio</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works - Borrowing */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">How to <span className="text-primary">Borrow</span></h2>
            <p className="text-lg text-muted-foreground">Follow these simple steps to get a loan using your NFT</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <Card className="p-6 space-y-4 border-primary/20 hover:border-primary/50 transition-all">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-bold">Connect Wallet</h3>
              <p className="text-muted-foreground text-sm">
                Connect your MetaMask wallet containing your NFTs to the platform
              </p>
            </Card>

            <Card className="p-6 space-y-4 border-primary/20 hover:border-primary/50 transition-all">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-bold">Select NFT</h3>
              <p className="text-muted-foreground text-sm">
                Choose the NFT you want to use as collateral from your wallet
              </p>
            </Card>

            <Card className="p-6 space-y-4 border-primary/20 hover:border-primary/50 transition-all">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-bold">Set Terms</h3>
              <p className="text-muted-foreground text-sm">
                Specify loan amount, interest rate, and duration. Your NFT gets locked in a smart contract
              </p>
            </Card>

            <Card className="p-6 space-y-4 border-primary/20 hover:border-primary/50 transition-all">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">4</span>
              </div>
              <h3 className="text-xl font-bold">Get Funded</h3>
              <p className="text-muted-foreground text-sm">
                Wait for a lender to fund your loan. Once funded, ETH is sent to your wallet instantly
              </p>
            </Card>
          </div>

          <Card className="mt-8 p-6 bg-blue-500/5 border-blue-500/20">
            <div className="flex items-start gap-3">
              <ImageIcon className="h-6 w-6 text-blue-500 shrink-0 mt-1" />
              <div className="space-y-2">
                <h4 className="font-semibold text-lg">NFT Examples</h4>
                <p className="text-muted-foreground">
                  You can use various types of NFTs as collateral, including:
                </p>
                <ul className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    <span><strong>PFP Collections:</strong> Bored Ape Yacht Club, CryptoPunks, Azuki</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    <span><strong>Gaming NFTs:</strong> Axie Infinity, Gods Unchained cards</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    <span><strong>Digital Art:</strong> Art Blocks, SuperRare pieces</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    <span><strong>Virtual Land:</strong> Decentraland, The Sandbox plots</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    <span><strong>Membership NFTs:</strong> VeeFriends, Moonbirds</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    <span><strong>Music NFTs:</strong> Sound.xyz, Catalog tracks</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* How It Works - Lending */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">How to <span className="text-primary">Lend</span></h2>
            <p className="text-lg text-muted-foreground">Earn returns by funding NFT-backed loans</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <Card className="p-6 space-y-4 border-primary/20 hover:border-primary/50 transition-all">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-bold">Browse Loans</h3>
              <p className="text-muted-foreground text-sm">
                Explore active loan requests and review borrower profiles and NFT collateral
              </p>
            </Card>

            <Card className="p-6 space-y-4 border-primary/20 hover:border-primary/50 transition-all">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-bold">Evaluate Risk</h3>
              <p className="text-muted-foreground text-sm">
                Check the collateral value, loan-to-value ratio, and interest rate
              </p>
            </Card>

            <Card className="p-6 space-y-4 border-primary/20 hover:border-primary/50 transition-all">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-bold">Fund Loan</h3>
              <p className="text-muted-foreground text-sm">
                Send ETH to fund the loan. Smart contract holds the NFT collateral
              </p>
            </Card>

            <Card className="p-6 space-y-4 border-primary/20 hover:border-primary/50 transition-all">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">4</span>
              </div>
              <h3 className="text-xl font-bold">Earn Returns</h3>
              <p className="text-muted-foreground text-sm">
                Receive principal + interest when repaid, or claim NFT if borrower defaults
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Key <span className="text-primary">Features</span></h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Smart Contract Security</h3>
              <p className="text-muted-foreground">
                All loans are secured by audited smart contracts on the Ethereum blockchain. Your NFT collateral is safely locked until loan repayment or default.
              </p>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Flexible Terms</h3>
              <p className="text-muted-foreground">
                Borrowers set their own loan terms including amount, duration (in days), and interest rate. Lenders choose loans that match their risk appetite.
              </p>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Competitive Rates</h3>
              <p className="text-muted-foreground">
                Market-driven interest rates ensure fair pricing. Borrowers get competitive rates, while lenders earn attractive returns on their capital.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Understanding Key Terms */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Understanding <span className="text-primary">Key Terms</span></h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 space-y-3">
              <h3 className="text-lg font-bold text-primary">Wei (Currency Unit)</h3>
              <p className="text-muted-foreground text-sm">
                Wei is the smallest unit of Ether (ETH). 1 ETH = 1,000,000,000,000,000,000 Wei (10¹⁸). 
                We display amounts in Wei for maximum precision when dealing with cryptocurrency values.
              </p>
            </Card>

            <Card className="p-6 space-y-3">
              <h3 className="text-lg font-bold text-primary">LTV Ratio (Loan-to-Value)</h3>
              <p className="text-muted-foreground text-sm">
                The ratio of the loan amount to the collateral value. A 80% LTV means you can borrow up to 80% of your NFT's estimated value. 
                Lower LTV = safer for lenders.
              </p>
            </Card>

            <Card className="p-6 space-y-3">
              <h3 className="text-lg font-bold text-primary">APR (Annual Percentage Rate)</h3>
              <p className="text-muted-foreground text-sm">
                The yearly interest rate on the loan. For example, 30% APR on a 30-day loan means you'll pay approximately 2.5% interest 
                (30% ÷ 12 months = 2.5% per month).
              </p>
            </Card>

            <Card className="p-6 space-y-3">
              <h3 className="text-lg font-bold text-primary">Liquidation</h3>
              <p className="text-muted-foreground text-sm">
                If a borrower fails to repay by the due date, the lender can liquidate the loan and claim the NFT collateral. 
                This protects lenders from default risk.
              </p>
            </Card>

            <Card className="p-6 space-y-3">
              <h3 className="text-lg font-bold text-primary">Smart Contract</h3>
              <p className="text-muted-foreground text-sm">
                Self-executing code on the blockchain that automatically enforces loan terms. No middleman needed - everything happens automatically and transparently.
              </p>
            </Card>

            <Card className="p-6 space-y-3">
              <h3 className="text-lg font-bold text-primary">Gas Fees</h3>
              <p className="text-muted-foreground text-sm">
                Transaction fees paid to Ethereum miners for processing your transactions. These fees vary based on network congestion 
                and are separate from loan interest.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Safety & Security */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Safety & <span className="text-primary">Security</span></h2>
          </div>

          <Card className="p-8 space-y-6">
            <div className="flex items-start gap-4">
              <Shield className="h-8 w-8 text-primary shrink-0" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Blockchain-Secured Transactions</h3>
                <p className="text-muted-foreground">
                  Every loan is recorded on the Ethereum blockchain, ensuring complete transparency and immutability. 
                  Smart contracts automatically handle collateral locking, fund transfers, and repayments.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Lock className="h-8 w-8 text-primary shrink-0" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Non-Custodial Platform</h3>
                <p className="text-muted-foreground">
                  You maintain full control of your assets. We never hold your funds or NFTs - everything is managed by smart contracts. 
                  Only you can access your connected wallet.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <FileText className="h-8 w-8 text-primary shrink-0" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Transparent Terms</h3>
                <p className="text-muted-foreground">
                  All loan terms are clearly displayed before confirmation. Interest calculations, due dates, and collateral details 
                  are transparent from the start. No hidden fees or surprises.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-primary/10 via-transparent to-primary/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-3xl" />

        <div className="container mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-4xl sm:text-5xl font-bold">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of users unlocking liquidity from their NFTs or earning returns by lending.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/home/explore">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-nft-glow-lg group">
                  Start Exploring Loans
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/">
                <Button size="lg" variant="outline" className="border-primary/30">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LearnMorePage;
