// app/api/loans/fund/route.ts

import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { off } from "process";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { loanId, lenderAddress, txHash, offerId } = body;

    // Validate required fields
    if (!loanId) {
      return Response.json(
        { success: false, error: "Loan ID is required" },
        { status: 400 }
      );
    }

    if (!lenderAddress) {
      return Response.json(
        { success: false, error: "Lender address is required" },
        { status: 400 }
      );
    }

    if (!txHash) {
      return Response.json(
        { success: false, error: "Transaction hash is required" },
        { status: 400 }
      );
    }
     if (!offerId) {
      return Response.json(
        { success: false, error: "Offer ID is required" },
        { status: 400 }
      );
    }

    // Find the loan
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        borrower: true,
      },
    });

    if (!loan) {
      return Response.json(
        { success: false, error: "Loan not found" },
        { status: 404 }
      );
    }

    // Check if loan is still active
    if (loan.status !== "ACTIVE") {
      return Response.json(
        {
          success: false,
          error: `Loan is not active. Current status: ${loan.status}`,
        },
        { status: 400 }
      );
    }

    // Find or create lender user
    let lender = await prisma.user.findUnique({
      where: { walletAddress: lenderAddress },
    });

    if (!lender) {
      // Create a new user for the lender
      lender = await prisma.user.create({
        data: {
          username: `Lender_${lenderAddress.slice(0, 6)}`,
          walletAddress: lenderAddress,
          totalLent: loan.amount,
        },
      });
    } else {
      // Update lender's total lent amount
      const currentTotalLent = BigInt(lender.totalLent || "0");
      const loanAmount = BigInt(loan.amount);
      const newTotalLent = currentTotalLent + loanAmount;

      await prisma.user.update({
        where: { id: lender.id },
        data: {
          totalLent: newTotalLent.toString(),
        },
      });
    }

    // Update the loan with lender information
    const updatedLoan = await prisma.loan.update({
      where: { id: loanId },
      data: {
        lenderId: lender.id,
        status: "FUNDED", // Loan is now funded by a lender
        startDate: new Date(), // Update start date to when it was funded
      },
      include: {
        borrower: true,
        lender: true,
      },
    });

    // Create a transaction record for the funding
    await prisma.transaction.create({
      data: {
        loanId: loan.id,
        type: "LOAN_FUNDED",
        amount: loan.amount,
        txHash: txHash,
        blockNumber: 0, // Will be updated by blockchain listener if needed
        timestamp: new Date(),
      },
    });

    console.log("Loan funded successfully:", {
      loanId: loan.id,
      borrower: loan.borrower.walletAddress,
      lender: lenderAddress,
      amount: loan.amount,
      txHash: txHash,
    });

    return Response.json({
      success: true,
      loan: {
        id: updatedLoan.id,
        borrower: {
          username: updatedLoan.borrower.username,
          walletAddress: updatedLoan.borrower.walletAddress,
        },
        lender: {
          username: updatedLoan.lender.username,
          walletAddress: updatedLoan.lender.walletAddress,
        },
        amount: updatedLoan.amount,
        interestRate: updatedLoan.interestRate,
        duration: updatedLoan.duration,
        status: updatedLoan.status,
        dueDate: updatedLoan.dueDate,
        txHash: txHash,
      },
      message: "Loan funded successfully",
    });
  } catch (error) {
    console.error("Error funding loan:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to fund loan",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch all active loan offers for lenders to browse
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const excludeAddress = searchParams.get("excludeAddress"); // Exclude user's own loans

    // Fetch all ACTIVE loans that haven't been funded yet
    // In your current schema, you might want to add a field to track if loan is funded
    // For now, we'll check if lenderId equals borrowerId (unfunded state)
    const loans = await prisma.loan.findMany({
      where: {
        status: "ACTIVE",
        // Unfunded loans have lenderId = borrowerId
        borrowerId: {
          not: undefined,
        },
        ...(excludeAddress && {
          borrower: {
            walletAddress: {
              not: excludeAddress,
            },
          },
        }),
      },
      include: {
        borrower: {
          select: {
            username: true,
            walletAddress: true,
            reputation: true,
          },
        },
        lender: {
          select: {
            username: true,
            walletAddress: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Filter out loans where lender has already been assigned (funded loans)
    const activeOffers = loans.filter(
      (loan) => loan.lenderId === loan.borrowerId
    );

    return Response.json({
      success: true,
      loans: activeOffers,
      count: activeOffers.length,
    });
  } catch (error) {
    console.error("Error fetching loan offers:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to fetch loan offers",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}