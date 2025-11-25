# LendVault

## About

LendVault is a decentralized peer-to-peer lending platform built on Ethereum that allows users to use their NFTs as collateral to borrow ETH or lend ETH to earn attractive interest rates. The platform leverages blockchain smart contracts to ensure secure, transparent, and trustless lending transactions.

**Key Features:**
- Use NFTs as collateral for ETH loans
- Earn interest by lending ETH to borrowers
- Secured by Ethereum smart contracts
- Instant loan funding and repayment
- Automated liquidation for defaulted loans
- Real-time statistics and loan tracking
- Flexible loan terms (amount, duration, interest rate)

<img width="1905" height="920" alt="image" src="https://github.com/user-attachments/assets/eef31b91-3f29-4f16-b841-412a0409ebc6" />

---

## Live Demo

[Visit LendVault](https://lend-vault-eight.vercel.app/) 

---

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Ethers.js 6** - Ethereum interaction library
- **Sonner** - Toast notifications

### Backend & Database
- **Prisma** - Next-generation ORM
- **PostgreSQL** (Neon) - Serverless database
- **Next.js API Routes** - Backend endpoints

### Blockchain
- **Ethereum (Sepolia Testnet)** - Blockchain network
- **Solidity** - Smart contract language
- **MetaMask** - Wallet integration

### External Services
- **Alchemy** - Blockchain API provider
- **Pinata** - IPFS pinning service for NFT metadata

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                    (Next.js + React + TailwindCSS)             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
        ┌───────▼────────┐       ┌───────▼────────┐
        │   Web3 Layer   │       │   API Routes   │
        │  (Ethers.js)   │       │   (Next.js)    │
        └───────┬────────┘       └───────┬────────┘
                │                        │
        ┌───────▼────────┐       ┌───────▼────────┐
        │  Smart         │       │   Prisma ORM   │
        │  Contracts     │       │                │
        │  (Ethereum)    │       └───────┬────────┘
        └────────────────┘               │
                                 ┌───────▼────────┐
                                 │   PostgreSQL   │
                                 │   (Database)   │
                                 └────────────────┘
```

---


## Smart Contracts

LendVault uses two main smart contracts deployed on Ethereum Sepolia Testnet:

1. **LendVault Contract** (`0xAC002c0F37D37F83007C67f86476b4C342D0Fa98`)
   - Handles loan creation, funding, repayment, and liquidation
   - Manages NFT collateral escrow
   - Enforces loan terms and conditions

2. **NFT Contract** (`0xd01374955b76369603A80D2135a2B47b822dCBE6`)
   - ERC-721 compliant NFT contract
   - Used for testing and demonstration

### Smart Contract Interaction Flow


<img width="800" height="1250" alt="Sm_flow" src="https://github.com/user-attachments/assets/b8bb7dbb-9ca1-4275-8dcc-e0c3ad2f3088" />

---

## How It Works

### For Borrowers

1. **Connect Wallet** - Connect your MetaMask wallet containing NFTs
2. **Create Loan Request** - Select an NFT as collateral and set loan terms:
   - Loan amount (in Wei)
   - Interest rate (APR)
   - Duration (in days)
3. **Wait for Funding** - Your loan appears on the explore page for lenders
4. **Receive ETH** - Once funded, ETH is sent to your wallet instantly
5. **Repay Loan** - Repay principal + interest before due date to reclaim your NFT

**Borrower Flow Diagram:**
```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Connect   │─────►│   Select    │─────►│    Set      │─────►│   Submit    │─────►│   Receive   │
│   Wallet    │      │     NFT     │      │ Loan Terms  │      │ to Blockchain│     │     ETH     │
└─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
                                                                                            │
                                                                                            ▼
                                                                                      ┌─────────────┐
                                                                                      │    Repay    │
                                                                                      │  Get NFT    │
                                                                                      └─────────────┘


```

### For Lenders

1. **Browse Loans** - Explore active loan requests with detailed information
2. **Evaluate Risk** - Check collateral value, LTV ratio, and borrower reputation
3. **Fund Loan** - Send ETH to fund a loan and earn interest
4. **Earn Returns** - Receive principal + interest when borrower repays
5. **Liquidate (if needed)** - Claim NFT collateral if loan defaults

**Lender Flow Diagram:**
```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Browse    │─────►│   Evaluate  │─────►│    Fund     │─────►│    Wait     │─────►│    Earn     │
│   Loans     │      │    Risk     │      │    Loan     │      │  Repayment  │      │  Returns    │
└─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
                                                                                            │
                                                                                            │ (if default)
                                                                                            ▼
                                                                                      ┌─────────────┐
                                                                                      │  Liquidate  │
                                                                                      │  Claim NFT  │
                                                                                      └─────────────┘
```

---

## Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- MetaMask wallet
- PostgreSQL database (or Neon account)
- Alchemy API key
- Pinata API keys (for NFT operations)

### 1. Clone the Repository

```bash
https://github.com/Mr-Malik-Aryan/LendVault.git
cd LendVault
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Database
DATABASE_URL="your_postgresql_connection_string"

# Alchemy API
ALCHEMY_API_KEY="your_alchemy_api_key"

# Smart Contracts (Sepolia Testnet)
NEXT_PUBLIC_LENDVAULT_CONTRACT_ADDRESS="0xAC002c0F37D37F83007C67f86476b4C342D0Fa98"
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS="0xd01374955b76369603A80D2135a2B47b822dCBE6"

# Pinata (for IPFS)
NEXT_PUBLIC_PINATA_API_KEY="your_pinata_api_key"
NEXT_PUBLIC_PINATA_SECRET_KEY="your_pinata_secret_key"
```

### 4. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
lend-vault/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── loans/                # Loan management endpoints
│   │   ├── nft/                  # NFT-related endpoints
│   │   ├── register/             # User registration
│   │   └── stats/                # Platform statistics
│   ├── home/                     # Protected pages
│   │   ├── explore/              # Browse loans
│   │   ├── loans/                # Create loan requests
│   │   ├── account/              # User account
│   │   ├── nfts/                 # NFT management
│   │   └── mint-nfts/            # Mint test NFTs
│   ├── learn-more/               # Information page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── ui/                       # Reusable UI components
│   ├── ConnectWallet.tsx         # Wallet connection
│   ├── Investment.tsx            # Investment modal
│   ├── Navbar.tsx                # Navigation bar
│   ├── Sidebar.tsx               # Dashboard sidebar
│   └── ...                       # Other components
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts                # Authentication hook
│   └── useNFTs.ts                # NFT operations hook
├── lib/                          # Utility functions
│   ├── prisma.ts                 # Prisma client
│   └── utils.ts                  # Helper functions
├── prisma/                       # Database
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Migration files
└── public/                       # Static assets
```

---

## Database Schema

### User
- Stores user information, wallet address, and reputation
- Tracks total borrowed and lent amounts

### Loan
- Contains loan details (amount, interest rate, duration)
- Links borrower and lender
- Stores collateral information and NFT image URLs
- Tracks loan status (ACTIVE, FUNDED, REPAID, DEFAULTED, LIQUIDATED)
- References blockchain transaction hashes and smart contract IDs

### Collateral
- Stores NFT collateral details
- Tracks lock status and associated loans

### Transaction
- Records all loan-related transactions
- Links to blockchain transaction hashes

**Database Schema Diagram:**
```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│      User       │         │      Loan       │         │   Collateral    │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ id (PK)         │◄───┐    │ id (PK)         │    ┌───►│ id (PK)         │
│ walletAddress   │    │    │ borrowerId (FK) │────┘    │ nftAddress      │
│ reputation      │    │    │ lenderId (FK)   │─────┐   │ tokenId         │
│ totalBorrowed   │    └────│ amount          │     │   │ estimatedValue  │
│ totalLent       │         │ interestRate    │     │   │ isLocked        │
│ createdAt       │    ┌────│ duration        │     │   │ loanId (FK)     │
└─────────────────┘    │    │ collateralId    │─────┘   └─────────────────┘
                       │    │ status          │
                       │    │ txHash          │
                       │    │ contractLoanId  │         ┌─────────────────┐
                       │    │ createdAt       │         │  Transaction    │
                       │    └─────────────────┘         ├─────────────────┤
                       │                                │ id (PK)         │
                       └────────────────────────────────│ loanId (FK)     │
                                                        │ type            │
                                                        │ amount          │
                                                        │ txHash          │
                                                        │ timestamp       │
                                                        └─────────────────┘
```

---

## Security Features

- **Smart Contract Escrow** - NFTs locked in smart contracts during loan period
- **Automated Liquidation** - Overdue loans automatically liquidatable by lenders
- **Non-Custodial** - Users maintain full control of their wallets
- **Blockchain Verification** - All transactions verified on Ethereum
- **LTV Ratio Protection** - Maximum 80% loan-to-value ratio
- **Reputation System** - Track user reliability

---

## Features Showcase

### Landing Page
- Hero section with animated statistics
- Featured active loan offers
- Platform statistics with counting animations
- Key features overview
- Call-to-action sections

<img width="1901" height="962" alt="image" src="https://github.com/user-attachments/assets/944f5e3e-9a6f-4be9-a5f1-b378215f00cb" />

<img width="1901" height="963" alt="image" src="https://github.com/user-attachments/assets/08a1624f-b6b7-4171-ab24-8f0534459d8d" />


### Loan Creation
- NFT selection from connected wallet
- Customizable loan terms
- Real-time collateral value estimation
- Instant blockchain submission

<img width="1901" height="962" alt="image" src="https://github.com/user-attachments/assets/f93116b9-f947-45b5-a20d-12a0392b5c93" />


### Explore Loans
- Filter and sort loan opportunities
- Detailed loan cards with NFT images
- Investment calculator
- One-click investment modal

<img width="1901" height="962" alt="Screenshot from 2025-11-25 14-34-10" src="https://github.com/user-attachments/assets/3736cf05-2e04-4f01-aa8e-c0e8acc95ff5" />


### Investment Modal
- Comprehensive loan details
- Expected profit calculations (in Wei and ETH)
- Risk assessment information
- Collateral visualization
- Secure funding with MetaMask

<img width="1901" height="933" alt="Screenshot from 2025-11-25 14-35-02" src="https://github.com/user-attachments/assets/c3e12d5d-2037-41cd-a48b-5aee1d6888a3" />


### Dashboard
- View active, funded, and repaid loans
- Track borrowed and lent amounts
- Loan repayment interface
- Liquidation options for overdue loans

<img width="1901" height="933" alt="image" src="https://github.com/user-attachments/assets/faa946a0-c414-4f6c-9e8b-6ea1ea02b12c" />


---

## Testing

### Get Test ETH
Visit the "Get ETH" page in the app for faucet links to get Sepolia testnet ETH.

### Mint Test NFTs
Use the "Mint NFTs" page to mint test NFTs for trying out the platform.

### Test Workflow
1. Mint a test NFT
2. Create a loan request using the NFT as collateral
3. Switch accounts and fund the loan
4. Test repayment or liquidation flows

---

## Key Metrics Display

All monetary values in LendVault are displayed in **Wei** for development ease:
- **Wei**: Smallest unit of Ether (1 ETH = 10¹⁸ Wei)
- Large numbers are abbreviated (K, M, B, T, Q) for readability
- Scientific notation used for ETH approximations

**Example:**
- Loan Amount: `1,000,000,000,000,000 Wei` (1.0e-3 ETH)
- Profit: `50,000,000,000,000 Wei` (5.0e-5 ETH)

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Authors

- **Aryan Malik** - [@Mr-Malik-Aryan](https://github.com/Mr-Malik-Aryan)
- **Kartik Maheshwari** -[@Kartikmaheshwari080205](https://github.com/Kartikmaheshwari080205)
- **Suryabha Mukhopadhyay** - [@suryabha-m2004](https://github.com/suryabha-m2004)

---

## Acknowledgments

- Ethereum Foundation for blockchain infrastructure
- Neon for serverless PostgreSQL
- Alchemy for blockchain API services
- Vercel for hosting platform
- Radix UI for accessible components
- LogoIpsum for creative opensource logos

---

## Support

For support, email [aryanmalik3333333333@gmail.com].

---

## Disclaimer

This is a demonstration project deployed on Ethereum Sepolia testnet. Do not use real assets or expect production-level security. Always perform your own security audits before using in production with real funds.



**Built for the Ethereum ecosystem**
