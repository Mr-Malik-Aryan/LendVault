"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, X, AlertCircle, Check } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<string[]>;
  isMetaMask?: boolean;
  on: (event: string, handler: (accounts: string[]) => void) => void;
}

interface PhantomProvider {
  solana: {
    connect: () => Promise<{ publicKey: { toString: () => string } }>;
  };
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
    phantom?: PhantomProvider;
  }
}

export default function WalletConnectButton({ onConnect }: { onConnect?: (data: any) => void }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("signup");
  const [selectedWallet, setSelectedWallet] = useState('');
  const [username, setUsername] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
  };

  const isPhantomInstalled = () => {
    return typeof window !== 'undefined' && typeof window.phantom?.solana !== 'undefined';
  };

  const connectMetaMask = async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install from metamask.io');
      return null;
    }

    try {
      const accounts = await window.ethereum!.request({
        method: 'eth_requestAccounts'
      });
      return accounts[0];
    } catch (err) {
      const error = err as any;
      if (error.code === 4001) {
        setError('Connection rejected by user');
      } else {
        setError('Failed to connect MetaMask');
      }
      return null;
    }
  };

  const connectPhantom = async () => {
    if (!isPhantomInstalled()) {
      setError('Phantom wallet is not installed. Please install from phantom.app');
      return null;
    }

    try {
      const resp = await window.phantom!.solana.connect();
      return resp.publicKey.toString();
    } catch (err) {
      const error = err as any;
      if (error.code === 4001) {
        setError('Connection rejected by user');
      } else {
        setError('Failed to connect Phantom');
      }
      return null;
    }
  };

  const handleWalletSelect = async (wallet: string) => {
    setSelectedWallet(wallet);
    setError('');
    setIsConnecting(true);

    let address = null;

    if (wallet === 'metamask') address = await connectMetaMask();
    else if (wallet === 'phantom') address = await connectPhantom();

    setIsConnecting(false);
    if (address) setWalletAddress(address);
  };

  const handleSubmit = async () => {
    if (activeTab === "signup") {
      // Signup validation
      if (!username.trim()) {
        setError("Please enter a username");
        return;
      }

      if (!walletAddress) {
        setError("Please connect a wallet first");
        return;
      }

      const connectionData = {
        username: username.trim(),
        walletAddress: walletAddress,
        walletType: selectedWallet,
        timestamp: new Date().toISOString(),
      };

      try {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: connectionData.username,
            walletAddress: connectionData.walletAddress,
          }),
        });

        if (response.ok) {
          const userData = await response.json();
          // Store wallet address in localStorage for authentication
          localStorage.setItem("walletAddress", connectionData.walletAddress);
          localStorage.setItem("username", connectionData.username);
          
          toast.success("User registered successfully!", {
            description: `Welcome ${connectionData.username}!`,
          });
          
          // Redirect to explore page after 1 second
          setTimeout(() => {
            router.push("/home/explore");
          }, 1000);
          
          setIsModalOpen(false);
          resetForm();
          if (onConnect) onConnect(connectionData);
        } else {
          const errorData = await response.json();
          toast.error("Registration failed", {
            description: errorData.error || "Failed to register user.",
          });
        }
      } catch (error) {
        toast.error("Connection error", {
          description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        });
      }
    } else {
      // Login validation
      if (!walletAddress) {
        setError("Please connect a wallet first");
        return;
      }

      try {
        const response = await fetch(
          `/api/auth/check?walletAddress=${walletAddress}`
        );
        const data = await response.json();

        if (data.authenticated) {
          // Store wallet address in localStorage
          localStorage.setItem("walletAddress", walletAddress);
          localStorage.setItem("username", data.user.username);
          
          toast.success("Login successful!", {
            description: `Welcome back, ${data.user.username}!`,
          });
          
          // Redirect to explore page after 1 second
          setTimeout(() => {
            router.push("/home/explore");
          }, 1000);
          
          setIsModalOpen(false);
          resetForm();
        } else {
          toast.error("Login failed", {
            description: "No account found with this wallet address.",
          });
        }
      } catch (error) {
        toast.error("Connection error", {
          description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        });
      }
    }
  };

  const resetForm = () => {
    setSelectedWallet('');
    setUsername('');
    setWalletAddress('');
    setError('');
    setIsConnecting(false);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <>
      {/* Connect Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
      >
        <Wallet className="w-5 h-5" />
        Connect Wallet
      </button>

      {/* MODAL WITH FULLSCREEN BLUR BACKDROP */}
      {isModalOpen && (
        <div className="fixed min-h-screen inset-0 z-50 flex items-center justify-center">
          
          {/* BACKDROP LAYER */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

          {/* MODAL */}
          <div className="relative bg-background rounded-2xl shadow-2xl max-w-md w-full border border-border">

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-secondary-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Connect Wallet
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {activeTab === "signup" ? "Create a new account" : "Sign in to your account"}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <Tabs defaultValue="signup" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-secondary">
                  <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Sign Up
                  </TabsTrigger>
                  <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Login
                  </TabsTrigger>
                </TabsList>

                {/* Sign Up Tab */}
                <TabsContent value="signup" className="space-y-6">
                  {/* Error */}
                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Username Input */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  {/* Wallet Selection */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Choose Wallet
                    </label>
                    <div className="space-y-3">

                      {/* MetaMask */}
                      <button
                        type="button"
                        onClick={() => handleWalletSelect('metamask')}
                        disabled={isConnecting}
                        className={`w-full p-4 border-2 rounded-lg transition-all flex items-center justify-between ${
                          selectedWallet === 'metamask'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50 hover:bg-accent/10'
                        } ${!isMetaMaskInstalled() ? 'opacity-75' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center overflow-hidden">
                            <Image
                              src="/metamask_logo.jpeg"
                              alt="MetaMask"
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-foreground">MetaMask</p>
                            <p className="text-xs text-muted-foreground">
                              {isMetaMaskInstalled() ? 'Ethereum wallet' : 'Not installed'}
                            </p>
                          </div>
                        </div>

                        {selectedWallet === 'metamask' && walletAddress && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-primary">
                              {formatAddress(walletAddress)}
                            </span>
                            <Check className="w-5 h-5 text-primary" />
                          </div>
                        )}
                      </button>

                      {/* Phantom */}
                      <button
                        type="button"
                        onClick={() => handleWalletSelect('phantom')}
                        disabled={isConnecting}
                        className={`w-full p-4 border-2 rounded-lg transition-all flex items-center justify-between ${
                          selectedWallet === 'phantom'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50 hover:bg-accent/10'
                        } ${!isPhantomInstalled() ? 'opacity-75' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center overflow-hidden">
                            <Image
                              src="/phantom_logo.png"
                              alt="Phantom"
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-foreground">Phantom</p>
                            <p className="text-xs text-muted-foreground">
                              {isPhantomInstalled() ? 'Solana wallet' : 'Not installed'}
                            </p>
                          </div>
                        </div>

                        {selectedWallet === 'phantom' && walletAddress && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-primary">
                              {formatAddress(walletAddress)}
                            </span>
                            <Check className="w-5 h-5 text-primary" />
                          </div>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={!walletAddress || !username.trim() || isConnecting}
                    className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground font-semibold py-3 px-4 rounded-lg transition-colors"
                  >
                    {isConnecting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground" />
                        Connecting...
                      </span>
                    ) : (
                      'Sign Up'
                    )}
                  </button>
                </TabsContent>

                {/* Login Tab */}
                <TabsContent value="login" className="space-y-6">
                  {/* Error */}
                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Wallet Selection for Login */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Connect Your Wallet
                    </label>
                    <div className="space-y-3">

                      {/* MetaMask */}
                      <button
                        type="button"
                        onClick={() => handleWalletSelect('metamask')}
                        disabled={isConnecting}
                        className={`w-full p-4 border-2 rounded-lg transition-all flex items-center justify-between ${
                          selectedWallet === 'metamask'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50 hover:bg-accent/10'
                        } ${!isMetaMaskInstalled() ? 'opacity-75' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center overflow-hidden">
                            <Image
                              src="/metamask_logo.jpeg"
                              alt="MetaMask"
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-foreground">MetaMask</p>
                            <p className="text-xs text-muted-foreground">
                              {isMetaMaskInstalled() ? 'Ethereum wallet' : 'Not installed'}
                            </p>
                          </div>
                        </div>

                        {selectedWallet === 'metamask' && walletAddress && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-primary">
                              {formatAddress(walletAddress)}
                            </span>
                            <Check className="w-5 h-5 text-primary" />
                          </div>
                        )}
                      </button>

                      {/* Phantom */}
                      <button
                        type="button"
                        onClick={() => handleWalletSelect('phantom')}
                        disabled={isConnecting}
                        className={`w-full p-4 border-2 rounded-lg transition-all flex items-center justify-between ${
                          selectedWallet === 'phantom'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50 hover:bg-accent/10'
                        } ${!isPhantomInstalled() ? 'opacity-75' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center overflow-hidden">
                            <Image
                              src="/phantom_logo.png"
                              alt="Phantom"
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-foreground">Phantom</p>
                            <p className="text-xs text-muted-foreground">
                              {isPhantomInstalled() ? 'Solana wallet' : 'Not installed'}
                            </p>
                          </div>
                        </div>

                        {selectedWallet === 'phantom' && walletAddress && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-primary">
                              {formatAddress(walletAddress)}
                            </span>
                            <Check className="w-5 h-5 text-primary" />
                          </div>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={!walletAddress || isConnecting}
                    className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground font-semibold py-3 px-4 rounded-lg transition-colors"
                  >
                    {isConnecting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground" />
                        Connecting...
                      </span>
                    ) : (
                      'Login'
                    )}
                  </button>
                </TabsContent>
              </Tabs>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              <p className="text-xs text-muted-foreground text-center">
                By connecting, you agree to our Terms of Service
              </p>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
