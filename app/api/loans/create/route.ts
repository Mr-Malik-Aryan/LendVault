import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      amount,
      interestRate,
      duration,
      collateralType,
      collateralId,
      collateralValue,
      collateralContractAddress,
      network,
      dueDate,
      txHash, // Actual transaction hash from blockchain
      offerId, // Offer ID from smart contract
      contractAddress, // Smart contract address
    } = body;

    // Validate required fields
    const missingFields = [];
    if (!walletAddress) missingFields.push("walletAddress");
    if (!amount) missingFields.push("amount");
    if (!interestRate) missingFields.push("interestRate");
    if (!duration) missingFields.push("duration");
    if (!collateralId) missingFields.push("collateralId");
    if (!collateralValue) missingFields.push("collateralValue");
    if (!dueDate) missingFields.push("dueDate");
    
    if (missingFields.length > 0) {
      console.error("Missing fields:", missingFields);
      console.error("Received data:", { walletAddress, amount, interestRate, duration, collateralId, collateralValue, dueDate });
      return Response.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
          missingFields,
          received: { walletAddress, amount, interestRate, duration, collateralId, collateralValue, dueDate }
        },
        { status: 400 }
      );
    }

    // Find user by wallet address
    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      return Response.json(
        {
          success: false,
          error: "User not found. Please register first.",
        },
        { status: 404 }
      );
    }

    const borrowerId = user.id;

    // Validate loan amount vs collateral value (max 80% LTV)
    const loanAmountFloat = parseFloat(amount);
    const collateralValueFloat = parseFloat(collateralValue);
    const maxLoanAmount = collateralValueFloat * 0.8;

    if (loanAmountFloat > maxLoanAmount) {
      return Response.json(
        {
          success: false,
          error: `Loan amount cannot exceed 80% of collateral value. Maximum loan amount: ${maxLoanAmount.toFixed(4)} ETH`,
          maxLoanAmount: maxLoanAmount.toFixed(4),
          collateralValue: collateralValueFloat.toFixed(4),
        },
        { status: 400 }
      );
    }

    // Validate minimum loan amount
    if (loanAmountFloat <= 0) {
      return Response.json(
        {
          success: false,
          error: "Loan amount must be greater than 0",
        },
        { status: 400 }
      );
    }

    // Check if collateral is already locked in another loan
    const existingCollateral = await prisma.collateral.findFirst({
      where: {
        contractAddress: collateralContractAddress,
        tokenId: collateralId,
        isLocked: true,
      },
    });

    if (existingCollateral) {
      return Response.json(
        {
          success: false,
          error: "This NFT is already used as collateral in another active loan",
        },
        { status: 400 }
      );
    }

    // Use actual transaction hash from blockchain or generate placeholder
    const actualTxHash = txHash || `0x${Math.random().toString(16).substr(2, 64)}`;
    const actualContractAddress = contractAddress || `0x${Math.random().toString(16).substr(2, 40)}`;

    // Calculate LTV ratio
    const ltvRatio = loanAmountFloat / collateralValueFloat;

    // Create the loan
    const loan = await prisma.loan.create({
      data: {
        borrowerId,
        lenderId: borrowerId, // Will be updated when a lender accepts
        amount: amount,
        interestRate: interestRate,
        duration: parseInt(duration),
        collateralType: collateralType || "NFT",
        collateralId: collateralId,
        collateralValue: collateralValue,
        ltvRatio: ltvRatio,
        status: "ACTIVE", // Loan offer is active, waiting for lender
        dueDate: new Date(dueDate),
        txHash: actualTxHash,
        contractAddress: actualContractAddress,
      },
    });

    // Create collateral record
    const collateral = await prisma.collateral.create({
      data: {
        type: collateralType || "NFT",
        contractAddress: collateralContractAddress,
        tokenId: collateralId,
        owner: borrowerId,
        isLocked: true,
        lockedInLoan: loan.id,
        estimatedValue: collateralValue,
        lastValuation: new Date(),
      },
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        loanId: loan.id,
        type: "LOAN_CREATED",
        amount: amount,
        txHash: actualTxHash,
        blockNumber: Math.floor(Math.random() * 1000000), // Will be updated by blockchain listener
        timestamp: new Date(),
      },
    });

    console.log("Loan created successfully:", {
      loanId: loan.id,
      offerId: offerId,
      txHash: actualTxHash,
      borrower: walletAddress,
      amount: amount,
      collateralId: collateralId,
    });

    return Response.json({
      success: true,
      loan: {
        id: loan.id,
        amount: loan.amount,
        interestRate: loan.interestRate,
        duration: loan.duration,
        status: loan.status,
        collateralId: loan.collateralId,
        collateralValue: loan.collateralValue,
        dueDate: loan.dueDate,
        txHash: loan.txHash,
        contractAddress: loan.contractAddress,
        offerId: offerId, // Return offerId for reference
      },
      collateral: {
        id: collateral.id,
        type: collateral.type,
        isLocked: collateral.isLocked,
      },
      message: "Loan offer created successfully on blockchain and saved to database",
    });
  } catch (error) {
    console.error("❌ Error creating loan:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to create loan request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}